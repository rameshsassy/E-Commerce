import { dispatchEmail } from "./emailService.js";
import User from "../models/User.js";
import { appBaseUrl } from "../templates/_helpers.js";
import customerWelcome from "../templates/customer/customerWelcome.js";
import orderConfirmation from "../templates/customer/orderConfirmation.js";
import dispatchEmailTpl from "../templates/customer/dispatchEmail.js";
import shipmentUpdate from "../templates/customer/shipmentUpdate.js";
import thankYouEmail from "../templates/customer/thankYouEmail.js";
import paymentSuccess from "../templates/customer/paymentSuccess.js";
import refundUpdate from "../templates/customer/refundUpdate.js";
import cartReminder from "../templates/customer/cartReminder.js";
import newProductEmail from "../templates/customer/newProductEmail.js";
import festivalEmail from "../templates/customer/festivalEmail.js";
import sellerWelcome from "../templates/seller/sellerWelcome.js";
import sellerReferralInvite from "../templates/seller/sellerReferralInvite.js";
import newOrderSeller from "../templates/seller/newOrderSeller.js";
import weeklyReport from "../templates/seller/weeklyReport.js";
import monthlyInsights from "../templates/seller/monthlyInsights.js";
import premiumUpgrade from "../templates/seller/premiumUpgrade.js";
import bulkOrderSeller from "../templates/seller/bulkOrderSeller.js";
import kycApprovalSeller from "../templates/seller/kycApprovalSeller.js";
import kycRejectionSeller from "../templates/seller/kycRejectionSeller.js";
import passwordReset from "../templates/customer/passwordReset.js";


const base = () => appBaseUrl();

// --- Customer lifecycle ---
export const sendCustomerWelcomeEmail = async (user) => {
  const to = user?.email != null ? String(user.email).trim() : "";
  if (!to) {
    console.warn("[emailService] sendCustomerWelcomeEmail: missing email for user", user?._id);
    return { ok: false, skipped: true };
  }
  const html = customerWelcome(user.firstName || "there", base());
  const result = await dispatchEmail({
    templateType: "customer_welcome",
    to,
    subject: "Welcome to Aashansh — your customer account is ready",
    html,
    senderType: "customer",
    meta: { userId: user._id },
  });
  if (result?.skipped) return result;
  if (!result?.ok) {
    throw new Error(result?.error || "Customer welcome email failed to send");
  }
  return result;
};

export const sendSellerWelcomeEmail = async (user) => {
  const to = user?.email != null ? String(user.email).trim() : "";
  if (!to) {
    console.warn("[emailService] sendSellerWelcomeEmail: missing email for user", user?._id);
    return { ok: false, skipped: true };
  }
  const html = sellerWelcome(user.firstName || "there", `${base()}/seller/dashboard`);
  const result = await dispatchEmail({
    templateType: "seller_welcome",
    to,
    subject: "Welcome to Aashansh - Your Seller Journey Starts Here",
    html,
    senderType: "seller",
    meta: { userId: user._id },
  });
  if (result?.skipped) return result;
  if (!result?.ok) {
    throw new Error(result?.error || "Seller welcome email failed to send");
  }
  return result;
};

export const sendKycApprovalEmail = async (user) => {
  const to = user?.email != null ? String(user.email).trim() : "";
  if (!to) {
    console.warn("[emailService] sendKycApprovalEmail: missing email for user", user?._id);
    return { ok: false, skipped: true };
  }
  const html = kycApprovalSeller(user.firstName || "there", `${base()}/seller/dashboard`);
  const result = await dispatchEmail({
    templateType: "seller_kyc_approval",
    to,
    subject: "Congratulations! KYC Approved — You're All Set to Sell on Aashansh!",
    html,
    senderType: "seller",
    meta: { userId: user._id },
  });
  if (result?.skipped) return result;
  if (!result?.ok) {
    throw new Error(result?.error || "KYC approval email failed to send");
  }
  return result;
};

export const sendKycRejectionEmail = async (user) => {
  const to = user?.email != null ? String(user.email).trim() : "";
  if (!to) {
    console.warn("[emailService] sendKycRejectionEmail: missing email for user", user?._id);
    return { ok: false, skipped: true };
  }
  const html = kycRejectionSeller(user.firstName || "there", `${base()}/seller/dashboard`);
  const result = await dispatchEmail({
    templateType: "seller_kyc_rejection",
    to,
    subject: "KYC Not Approved Yet — Here's What to Do Next",
    html,
    senderType: "seller",
    meta: { userId: user._id },
  });
  if (result?.skipped) return result;
  if (!result?.ok) {
    throw new Error(result?.error || "KYC rejection email failed to send");
  }
  return result;
};

export const sendSellerReferralInviteEmail = async ({
  to,
  inviteeFirstName,
  inviteeLastName,
  inviteeVenture,
  inviteeType,
  inviteeContact,
  inviteeDesignation,
  senderName,
  referralLink,
  referrerId,
}) => {
  const email = to != null ? String(to).trim() : "";
  if (!email) {
    return { ok: false, skipped: true };
  }

  const logoUrl = `${base()}/brand/aashansh-logo.png`;
  const html = sellerReferralInvite({
    inviteeFirstName,
    inviteeVenture,
    senderName,
    referralLink,
    logoUrl,
  });

  const result = await dispatchEmail({
    templateType: "seller_referral_invite",
    to: email,
    subject: `${senderName || "A seller"} invited you to sell on Aashansh`,
    html,
    senderType: "seller",
    meta: {
      referrerId,
      inviteeVenture,
      inviteeType: inviteeType || null,
      inviteeContact: inviteeContact || null,
      inviteeDesignation: inviteeDesignation || null,
      inviteeLastName: inviteeLastName || null,
    },
  });

  if (result?.skipped) return result;
  if (!result?.ok) {
    throw new Error(result?.error || "Referral invitation email failed to send");
  }
  return result;
};

export const sendPremiumUpgradeEmail = async (user) => {
  const html = premiumUpgrade(user.firstName || "there", `${base()}/seller/dashboard`);
  await dispatchEmail({
    templateType: "seller_premium_upgrade",
    to: user.email,
    subject: "Premium Seller activated — welcome to Aashansh Premium",
    html,
    senderType: "seller",
    meta: { userId: user._id },
  });
};

export const sendWelcomeEmail = async (user) => {
  const html = `
    <h2>Welcome to Aashansh, ${user.firstName}!</h2>
    <p>We are thrilled to have you join our purpose-driven marketplace.</p>
    <p>Explore handcrafted products, empower women artisans, and enjoy a special 10% off your first purchase using code: <b>WELCOME10</b>.</p>
    <a href="${base()}/products" style="padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Start Shopping</a>
  `;
  await dispatchEmail({
    templateType: "customer_welcome_legacy",
    to: user.email,
    subject: "Welcome to Aashansh Marketplace! 🎉",
    html,
    senderType: "customer",
    meta: { userId: user._id },
  });
};

export const sendOrderConfirmationEmail = async (user, order) => {
  const html = orderConfirmation(user, order);
  await dispatchEmail({
    templateType: "customer_order_confirmation",
    to: user.email,
    subject: `Order Confirmed: #${order._id.toString().slice(-8)}`,
    html,
    senderType: "order",
    meta: { orderId: order._id },
  });
};

const DISPATCH_STATUSES = ["Shipped", "Out For Delivery"];

export const sendShipmentUpdateEmail = async (user, order, trackingId, courierName, status) => {
  const isDispatch = DISPATCH_STATUSES.includes(status);
  const html = isDispatch
    ? dispatchEmailTpl(user, order, trackingId, courierName, status)
    : shipmentUpdate(user, order, trackingId, courierName, status);
  await dispatchEmail({
    templateType: isDispatch ? "customer_dispatch" : "customer_shipment_update",
    to: user.email,
    subject: isDispatch ? `Your order is on the way — ${status}` : `Shipment Update: ${status}`,
    html,
    senderType: "order",
    meta: { orderId: order._id, status },
  });
};

export const sendPaymentSuccessEmail = async (user, amount, paymentId) => {
  const html = paymentSuccess(user, amount, paymentId);
  await dispatchEmail({
    templateType: "customer_payment_success",
    to: user.email,
    subject: "Payment Received Successfully",
    html,
    senderType: "order",
    meta: { paymentId },
  });
};

export const sendRefundUpdateEmail = async (user, orderId, amount, status) => {
  const html = refundUpdate(user, orderId, amount, status);
  await dispatchEmail({
    templateType: "customer_refund_update",
    to: user.email,
    subject: `Refund Update: ${status}`,
    html,
    senderType: "order",
    meta: { orderId, status },
  });
};

export const sendSellerNewOrderEmail = async (seller, customerName, customerPhone, address, order, items) => {
  const html = newOrderSeller(seller, customerName, customerPhone, address, order, items);
  await dispatchEmail({
    templateType: "seller_new_order",
    to: seller.email,
    subject: `New Order Alert! You've Got a New Order on Aashansh!`,
    html,
    senderType: "order",
    meta: { orderId: order._id, sellerId: seller._id },
  });
};

export const sendThankYouAfterDeliveryEmail = async (user, order) => {
  const html = thankYouEmail(user, order);
  await dispatchEmail({
    templateType: "customer_thank_you_post_delivery",
    to: user.email,
    subject: `Thanks for shopping with us — order #${order._id.toString().slice(-8)}`,
    html,
    senderType: "customer",
    meta: { orderId: order._id },
  });
};

export const sendCartAbandonmentReminder = async (user, itemsPreview) => {
  const html = cartReminder(user.firstName || "there", itemsPreview);
  await dispatchEmail({
    templateType: "customer_cart_reminder",
    to: user.email,
    subject: "You left items in your cart",
    html,
    senderType: "customer",
    meta: { userId: user._id },
  });
};

export const sendWeeklySellerReport = async (seller, summary) => {
  const html = weeklyReport(seller, summary);
  await dispatchEmail({
    templateType: "seller_weekly_report",
    to: seller.email,
    subject: "Weekly Aashansh Recap: Orders, Bulk Deals & Referral Wins!",
    html,
    senderType: "seller",
    meta: { sellerId: seller._id },
  });
};

export const sendMonthlySellerInsights = async (seller, insights) => {
  const html = monthlyInsights(seller, insights);
  await dispatchEmail({
    templateType: "seller_monthly_insights",
    to: seller.email,
    subject: "Monthly growth insights — Aashansh",
    html,
    senderType: "seller",
    meta: { sellerId: seller._id },
  });
};

export const sendNewProductLaunchEmail = async (customer, product) => {
  const url = `${base()}/product/${product._id}`;
  const html = newProductEmail(customer.firstName, product.title, url);
  await dispatchEmail({
    templateType: "customer_new_product_alert",
    to: customer.email,
    subject: `New: ${product.title}`,
    html,
    senderType: "customer",
    meta: { productId: product._id, userId: customer._id },
  });
};

export const sendFestivalCampaignEmail = async (customer, campaign) => {
  const html = festivalEmail(
    customer.firstName,
    campaign.headline,
    campaign.bodyHtml,
    campaign.ctaLabel || "Shop now",
    campaign.ctaPath || "/products"
  );
  await dispatchEmail({
    templateType: "customer_festival_campaign",
    to: customer.email,
    subject: campaign.subject || "A special message from Aashansh",
    html,
    senderType: "customer",
    meta: { campaignId: campaign.id || "festival" },
  });
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${base()}/reset-password/${resetToken}`;
  const html = passwordReset(user.firstName || "Customer", resetUrl);
  await dispatchEmail({
    templateType: "password_reset",
    to: user.email,
    subject: "Reset your Aashansh password",
    html,
    senderType: user.role === "seller" ? "seller" : "customer",
    meta: { userId: user._id },
  });
};

// --- Bulk inquiries (HTML kept compact; escape buyer message) ---
const escapeBulkHtml = (s) => {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

const adminBulkNotifyEmail = () =>
  process.env.PLATFORM_BULK_ADMIN_EMAIL ||
  process.env.ADMIN_NOTIFICATION_EMAIL ||
  process.env.SMTP_USER ||
  null;

export const sendBulkInquirySellerEmail = async (seller, payload) => {
  if (!seller.email) return;
  const html = bulkOrderSeller(seller, payload);
  await dispatchEmail({
    templateType: "seller_bulk_inquiry",
    to: seller.email,
    subject: "Bulk Order Alert! You've Got a New Order on Aashansh!",
    html,
    senderType: "seller",
    meta: { inquiryId: payload.inquiryId },
  });
};

export const sendBulkInquiryAdminEmail = async (payload) => {
  const to = adminBulkNotifyEmail();
  if (!to) {
    console.warn("[email] No admin notify address for bulk inquiries");
    return;
  }
  const html = `
    <h2>Bulk order inquiry (platform)</h2>
    <p><b>Inquiry ID:</b> ${payload.inquiryId}</p>
    <ul>
      <li><b>Product:</b> ${payload.productTitle} (${payload.productId})</li>
      <li><b>Buyer:</b> ${payload.buyerName}</li>
      <li><b>Email:</b> ${payload.buyerEmail}</li>
      <li><b>Phone:</b> ${payload.buyerPhone}</li>
      <li><b>Quantity:</b> ${payload.quantityRequired}</li>
      ${payload.message ? `<li><b>Message:</b> ${escapeBulkHtml(payload.message)}</li>` : ""}
    </ul>
    <p><a href="${payload.productUrl}">Product page</a></p>
  `;
  await dispatchEmail({
    templateType: "admin_bulk_inquiry",
    to,
    subject: `[Aashansh] Bulk inquiry — ${payload.productTitle}`,
    html,
    senderType: "customer",
    meta: { inquiryId: payload.inquiryId },
  });
};

export const sendBulkInquiryBuyerConfirmation = async (payload) => {
  const html = `
    <h2>We received your bulk inquiry</h2>
    <p>Hi ${payload.buyerName},</p>
    <p>Thank you for your interest in <b>${payload.productTitle}</b>.</p>
    <p>Your request for quantity <b>${payload.quantityRequired}</b> has been sent to the seller and our operations team.</p>
    <p><b>Reference:</b> ${payload.inquiryId}</p>
    <p><a href="${payload.productUrl}">Back to product</a></p>
    <p>— Team Aashansh</p>
  `;
  await dispatchEmail({
    templateType: "customer_bulk_inquiry_confirmation",
    to: payload.buyerEmail,
    subject: `Bulk inquiry received — ${payload.productTitle}`,
    html,
    senderType: "customer",
    meta: { inquiryId: payload.inquiryId },
  });
};

/** After a product is approved — notify opted-in customers */
export async function notifyCustomersNewProduct(product) {
  const customers = await User.find({
    role: "customer",
    emailNewProductAlerts: true,
  })
    .select("firstName email")
    .limit(150);

  for (const c of customers) {
    await sendNewProductLaunchEmail(c, product).catch(() => {});
  }
}
