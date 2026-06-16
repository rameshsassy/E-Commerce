/**
 * Reward Engine Service
 *
 * All reward calculation logic comes exclusively from Super Admin campaign
 * configuration. Nothing is hardcoded.
 *
 * Called when an order is marked "Delivered" or "Completed".
 */

import mongoose from "mongoose";
import RewardCampaign from "../models/RewardCampaign.js";
import RewardWallet from "../models/RewardWallet.js";
import RewardTransaction from "../models/RewardTransaction.js";
import RewardSettings from "../models/RewardSettings.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// ─────────────────────────────────────────────────────────
// Utility: generate a unique voucher code
// ─────────────────────────────────────────────────────────
function generateVoucherCode(prefix = "RWD") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = prefix + "-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function uniqueVoucherCode(prefix = "RWD") {
  let code;
  let attempts = 0;
  do {
    code = generateVoucherCode(prefix);
    const existing = await RewardWallet.findOne({ voucherCode: code });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);
  return code;
}

// ─────────────────────────────────────────────────────────
// Check if today is within campaign date range and status=active
// ─────────────────────────────────────────────────────────
function isCampaignActive(campaign) {
  const now = new Date();
  return (
    campaign.status === "active" &&
    new Date(campaign.startDate) <= now &&
    new Date(campaign.endDate) >= now
  );
}

// ─────────────────────────────────────────────────────────
// Check customer eligibility against campaign rules
// ─────────────────────────────────────────────────────────
async function isCustomerEligible(campaign, customerId, orderHistory) {
  const ce = campaign.customerEligibility;
  if (!ce || ce.type === "all") return true;

  const custObjId = customerId.toString();

  if (ce.type === "selected_customers") {
    return ce.customerIds.some((id) => id.toString() === custObjId);
  }

  if (ce.type === "new_customers_only") {
    // new = this is their first order (before this one)
    return orderHistory === 0;
  }

  if (ce.type === "existing_customers_only") {
    return orderHistory > 0;
  }

  if (ce.type === "premium_members_only") {
    // Future: check if customer has a premium membership flag
    // For now, return true so it doesn't silently block everyone
    return true;
  }

  return true;
}

// ─────────────────────────────────────────────────────────
// Check if a product/seller/category is excluded
// ─────────────────────────────────────────────────────────
function isExcluded(campaign, productDoc) {
  const ex = campaign.exclusionRules;
  if (!ex) return false;

  const prodId = productDoc._id.toString();
  const sellerId = productDoc.seller?.toString();
  const catId = productDoc.category?.toString();
  const sellerPlan = productDoc._sellerPlan; // injected below

  if (ex.productIds?.some((id) => id.toString() === prodId)) return true;
  if (sellerId && ex.sellerIds?.some((id) => id.toString() === sellerId)) return true;
  if (catId && ex.categoryIds?.some((id) => id.toString() === catId)) return true;
  if (sellerPlan && ex.sellerPlans?.includes(sellerPlan)) return true;

  return false;
}

// ─────────────────────────────────────────────────────────
// Check product eligibility
// ─────────────────────────────────────────────────────────
function isProductEligible(campaign, productDoc) {
  const pe = campaign.productEligibility;
  if (!pe || pe.type === "all") return true;

  const prodId = productDoc._id.toString();
  const sellerId = productDoc.seller?.toString();
  const catId = productDoc.category?.toString();
  const sellerPlan = productDoc._sellerPlan;

  if (pe.type === "selected_products") {
    return pe.productIds?.some((id) => id.toString() === prodId);
  }
  if (pe.type === "selected_categories") {
    return catId && pe.categoryIds?.some((id) => id.toString() === catId);
  }
  if (pe.type === "selected_sellers") {
    return sellerId && pe.sellerIds?.some((id) => id.toString() === sellerId);
  }
  if (pe.type === "selected_seller_plans") {
    return sellerPlan && pe.sellerPlans?.includes(sellerPlan);
  }
  return true;
}

// ─────────────────────────────────────────────────────────
// Calculate reward for a single item amount given campaign rules + seller plan
// ─────────────────────────────────────────────────────────
function calculateItemReward(campaign, itemAmount, sellerPlan) {
  const rule = campaign.rewardRule;
  if (!rule) return 0;

  const { rewardType } = rule;

  if (rewardType === "percentage") {
    // Seller-plan-specific percentage takes priority
    let pct = null;
    if (sellerPlan === "free" && rule.freeSellerRewardPercentage != null) {
      pct = rule.freeSellerRewardPercentage;
    } else if (sellerPlan === "pro" && rule.proSellerRewardPercentage != null) {
      pct = rule.proSellerRewardPercentage;
    } else if (sellerPlan === "premium" && rule.premiumSellerRewardPercentage != null) {
      pct = rule.premiumSellerRewardPercentage;
    } else {
      pct = rule.rewardPercentage || 0;
    }
    return (itemAmount * pct) / 100;
  }

  if (rewardType === "points") {
    // Points: reward 'rewardValue' points per 'spendAmount' spent
    if (!rule.spendAmount || rule.spendAmount <= 0) return 0;
    const units = Math.floor(itemAmount / rule.spendAmount);
    return units * (rule.rewardValue || 0);
  }

  if (rewardType === "fixed_voucher") {
    // Fixed: spend >= spendAmount → get rewardValue
    if (itemAmount >= (rule.spendAmount || 0)) {
      return rule.rewardValue || 0;
    }
    return 0;
  }

  return 0;
}

// ─────────────────────────────────────────────────────────
// Main: process reward for a delivered order
// ─────────────────────────────────────────────────────────
export async function processOrderReward(orderId) {
  try {
    // 1. Fetch global settings — check rewards are enabled
    const settings = await RewardSettings.findOne({ _singleton: "global" });
    if (settings && !settings.rewardsEnabled) {
      console.log("[RewardEngine] Rewards disabled globally.");
      return;
    }

    // 2. Fetch the order with populated items
    const order = await Order.findById(orderId)
      .populate({
        path: "items.product",
        select: "title category seller price",
      })
      .populate({
        path: "items.seller",
        select: "subscriptionPlan sellerType",
      });

    if (!order) {
      console.log("[RewardEngine] Order not found:", orderId);
      return;
    }

    // Avoid double-processing
    if (order.rewardProcessed) {
      console.log("[RewardEngine] Already processed for order:", orderId);
      return;
    }

    const customerId = order.user;

    // 3. Fetch active campaigns sorted by priority
    const now = new Date();
    const campaigns = await RewardCampaign.find({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ priority: 1 });

    if (!campaigns.length) {
      console.log("[RewardEngine] No active campaigns for order:", orderId);
      return;
    }

    // 4. Count previous orders for new/existing customer eligibility check
    const orderCount = await Order.countDocuments({
      user: customerId,
      _id: { $ne: orderId },
      paymentStatus: "completed",
    });

    // 5. Build enriched product map (inject sellerPlan)
    const enrichedItems = order.items.map((item) => {
      const sellerDoc = item.seller;
      const sellerPlan = sellerDoc?.subscriptionPlan || "free";
      const productDoc = item.product;
      if (productDoc) productDoc._sellerPlan = sellerPlan;
      return {
        product: productDoc,
        seller: sellerDoc,
        sellerPlan,
        price: item.price,
        quantity: item.quantity,
        lineTotal: item.price * item.quantity,
      };
    });

    let totalRewardEarned = 0;
    let appliedCampaign = null;

    // 6. Evaluate campaigns in priority order — apply first matching
    for (const campaign of campaigns) {
      // Check customer eligibility
      const customerOk = await isCustomerEligible(campaign, customerId, orderCount);
      if (!customerOk) continue;

      let campaignReward = 0;
      let dominantSellerPlan = null;

      for (const enrichedItem of enrichedItems) {
        const productDoc = enrichedItem.product;
        if (!productDoc) continue;

        // Check product eligibility
        if (!isProductEligible(campaign, productDoc)) continue;
        // Check exclusion rules
        if (isExcluded(campaign, productDoc)) continue;

        const itemReward = calculateItemReward(
          campaign,
          enrichedItem.lineTotal,
          enrichedItem.sellerPlan
        );

        if (itemReward > 0) {
          campaignReward += itemReward;
          dominantSellerPlan = enrichedItem.sellerPlan;
        }
      }

      // Apply max per order cap
      const rule = campaign.rewardRule;
      if (rule.maxRewardPerOrder && campaignReward > rule.maxRewardPerOrder) {
        campaignReward = rule.maxRewardPerOrder;
      }

      // Apply max per customer cap
      if (rule.maxRewardPerCustomer && rule.maxRewardPerCustomer > 0) {
        const existing = await RewardTransaction.aggregate([
          { $match: { customer: new mongoose.Types.ObjectId(customerId), type: "credit", status: "completed" } },
          { $group: { _id: null, total: { $sum: "$rewardEarned" } } },
        ]);
        const existingTotal = existing[0]?.total || 0;
        const remaining = rule.maxRewardPerCustomer - existingTotal;
        if (remaining <= 0) continue; // customer capped
        campaignReward = Math.min(campaignReward, remaining);
      }

      if (campaignReward > 0) {
        totalRewardEarned = campaignReward;
        appliedCampaign = campaign;

        // Check max active vouchers cap
        if (rule.maxActiveVouchers && rule.maxActiveVouchers > 0) {
          const activeCount = await RewardWallet.countDocuments({
            customer: customerId,
            status: "active",
          });
          if (activeCount >= rule.maxActiveVouchers) {
            console.log("[RewardEngine] Max active vouchers reached for customer:", customerId);
            break;
          }
        }

        // 7. Generate voucher code
        const prefix = campaign.campaignName.slice(0, 3).toUpperCase().replace(/\s/g, "");
        const voucherCode = await uniqueVoucherCode(prefix || "RWD");

        // Voucher expiry
        const expiryDays = rule.voucherExpiryDays || settings?.defaultVoucherExpiryDays || 30;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);

        // 8. Create wallet entry
        const wallet = await RewardWallet.create({
          customer: customerId,
          campaign: campaign._id,
          order: orderId,
          voucherCode,
          rewardType: rule.rewardType,
          rewardValue: Math.round(totalRewardEarned * 100) / 100,
          expiryDate,
          status: "active",
        });

        // 9. Create transaction record
        await RewardTransaction.create({
          customer: customerId,
          order: orderId,
          campaign: campaign._id,
          wallet: wallet._id,
          type: "credit",
          rewardType: rule.rewardType,
          sellerPlan: dominantSellerPlan,
          orderAmount: order.totalAmount,
          rewardEarned: Math.round(totalRewardEarned * 100) / 100,
          rewardRedeemed: 0,
          description: `Reward earned from campaign: ${campaign.campaignName}`,
          status: "completed",
        });

        // 10. Update campaign stats
        await RewardCampaign.findByIdAndUpdate(campaign._id, {
          $inc: {
            totalRewardsIssued: Math.round(totalRewardEarned * 100) / 100,
            totalCustomersRewarded: 1,
          },
        });

        console.log(
          `[RewardEngine] ✅ Reward ₹${totalRewardEarned.toFixed(2)} issued via campaign "${campaign.campaignName}" for order ${orderId}`
        );
        break; // Only apply the highest-priority matching campaign
      }
    }

    // 11. Mark order as reward-processed (prevents double processing)
    await Order.findByIdAndUpdate(orderId, { rewardProcessed: true });

  } catch (err) {
    // Non-blocking: reward failure should never break order delivery
    console.error("[RewardEngine] Error processing reward:", err.message);
  }
}

// ─────────────────────────────────────────────────────────
// Redeem a reward voucher at checkout
// ─────────────────────────────────────────────────────────
export async function redeemRewardVoucher(customerId, voucherId, orderId, orderAmount) {
  const wallet = await RewardWallet.findOne({
    _id: voucherId,
    customer: customerId,
    status: "active",
  }).populate("campaign");

  if (!wallet) throw new Error("Reward voucher not found or already used.");

  if (wallet.expiryDate < new Date()) {
    await RewardWallet.findByIdAndUpdate(voucherId, { status: "expired" });
    throw new Error("Reward voucher has expired.");
  }

  if (!wallet.campaign || wallet.campaign.status !== "active") {
    throw new Error("Associated reward campaign is no longer active.");
  }

  const rewardValue = Math.min(wallet.rewardValue, orderAmount);

  // Mark as redeemed
  await RewardWallet.findByIdAndUpdate(voucherId, {
    status: "redeemed",
    redeemedAt: new Date(),
    redeemedOnOrder: orderId,
  });

  // Create debit transaction
  await RewardTransaction.create({
    customer: customerId,
    order: orderId,
    campaign: wallet.campaign._id,
    wallet: voucherId,
    type: "debit",
    rewardType: wallet.rewardType,
    orderAmount,
    rewardEarned: 0,
    rewardRedeemed: rewardValue,
    description: `Reward redeemed: ${wallet.voucherCode}`,
    status: "completed",
  });

  // Update campaign redemption stats
  await RewardCampaign.findByIdAndUpdate(wallet.campaign._id, {
    $inc: { totalRewardsRedeemed: rewardValue },
  });

  return { rewardValue, voucherCode: wallet.voucherCode };
}
