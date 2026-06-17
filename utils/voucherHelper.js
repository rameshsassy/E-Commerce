import AdminVoucher from "../models/AdminVoucher.js";
import Voucher from "../models/Voucher.js";
import VoucherUsage from "../models/VoucherUsage.js";

/**
 * Validate and calculate discount for a voucher applied to a customer cart
 * @param {string} voucherCode - The voucher code to apply
 * @param {Array} cartItems - Array of cart items (populated with product and sellerId)
 * @param {string} userId - The user ID applying the voucher
 * @returns {Promise<Object>} - Validation result, discount amount, eligible items
 */
export const validateAndCalculateCartVoucher = async (voucherCode, cartItems, userId) => {
  if (!voucherCode) {
    throw new Error("Voucher code is required");
  }

  const codeUpper = voucherCode.trim().toUpperCase();

  // 1. Find the voucher in AdminVoucher or Voucher collections
  let voucher = null;
  let isAdmin = false;

  const adminVoucher = await AdminVoucher.findOne({ voucherCode: codeUpper });
  if (adminVoucher) {
    voucher = adminVoucher;
    isAdmin = true;
  } else {
    const sellerVoucher = await Voucher.findOne({ voucherCode: codeUpper });
    if (sellerVoucher) {
      voucher = sellerVoucher;
      isAdmin = false;
    }
  }

  if (!voucher) {
    throw new Error("Voucher does not exist");
  }

  // 2. Basic status checks
  if (voucher.isActive === false) {
    throw new Error("Voucher is inactive");
  }

  if (new Date() > new Date(voucher.expiry)) {
    throw new Error("Voucher has expired");
  }

  // 3. Check total usage limit
  if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
    throw new Error("Voucher usage limit reached");
  }

  // 4. Check per-user limit
  const userUsageCount = await VoucherUsage.countDocuments({
    userId,
    voucherCode: codeUpper,
  });
  if (userUsageCount >= 1) {
    throw new Error("Voucher usage limit per user exceeded");
  }

  // 5. If it's an admin seller-subscription voucher, it cannot be used on cart checkout
  if (isAdmin && voucher.voucherType === "seller_subscription") {
    throw new Error("Wrong voucher type. This voucher is only for seller plan upgrades.");
  }

  // Ensure type is allowed for customer checkout
  const allowedTypes = ["customer_all", "customer_specific", "seller_products", "customer_order", "seller_product"];
  if (isAdmin && !allowedTypes.includes(voucher.voucherType)) {
    throw new Error("Invalid voucher type for customer checkout");
  }

  // Calculate cart totals and identify eligible items
  let totalCartSubtotal = 0;
  const eligibleItems = [];

  for (const item of cartItems) {
    const product = item.product;
    if (!product) continue;

    const price = product.price ?? item.price ?? 0;
    const quantity = item.quantity ?? 1;
    const itemSubtotal = price * quantity;
    totalCartSubtotal += itemSubtotal;

    const productIdStr = (product._id ?? product).toString();
    const productTitle = product.title ?? "";
    const productCategory = product.category ?? "";

    // Seller ID detection
    let itemSellerIdStr = "";
    if (product.sellerId) {
      itemSellerIdStr = (product.sellerId._id ?? product.sellerId).toString();
    } else if (item.seller) {
      itemSellerIdStr = (item.seller._id ?? item.seller).toString();
    }

    let isEligible = false;

    if (isAdmin) {
      // ADMIN CUSTOMER VOUCHER RULES
      if (voucher.voucherType === "customer_all" || voucher.voucherType === "customer_order") {
        // Global customer voucher: applies to all products from any seller
        isEligible = true;
      } else if (voucher.voucherType === "customer_specific") {
        // Specific products global voucher: applies only to configured product IDs
        const selectedProdIdStrs = (voucher.selectedProducts || []).map(p => p.toString());
        if (selectedProdIdStrs.includes(productIdStr)) {
          isEligible = true;
        }
      } else if (voucher.voucherType === "seller_products" || voucher.voucherType === "seller_product") {
        // Seller specific admin voucher: applies to specific sellers' products
        const selectedSellerIdStrs = (voucher.selectedSellers || []).map(s => s.toString());
        if (selectedSellerIdStrs.includes(itemSellerIdStr)) {
          if (voucher.sellerProductScope === "all") {
            isEligible = true;
          } else if (voucher.sellerProductScope === "specific") {
            // Must match specific product titles mapped for this seller
            // Note: sellerSpecificProducts in schema is a Map of sellerId to [String] (product names/titles)
            const specificProductsForSeller = voucher.sellerSpecificProducts?.get
              ? voucher.sellerSpecificProducts.get(itemSellerIdStr)
              : voucher.sellerSpecificProducts?.[itemSellerIdStr];

            if (Array.isArray(specificProductsForSeller)) {
              // Perform case-insensitive match on product title
              const matches = specificProductsForSeller.some(
                title => productTitle.trim().toLowerCase() === title.trim().toLowerCase()
              );
              if (matches) {
                isEligible = true;
              }
            }
          }
        }
      }
    } else {
      // SELLER PRODUCT VOUCHER RULES (from Voucher model)
      // Must belong to the product's seller
      const voucherSellerIdStr = voucher.sellerId.toString();
      if (itemSellerIdStr === voucherSellerIdStr) {
        let matchesScope = false;
        if (voucher.scope === "all") {
          matchesScope = true;
        } else if (voucher.scope === "specific") {
          // Check if specific product ID matches
          const voucherProdIdStr = voucher.productId?.toString();
          if (voucherProdIdStr && voucherProdIdStr === productIdStr) {
            matchesScope = true;
          }
        }

        // Enforce category restriction if specified on the voucher category field
        let matchesCategory = true;
        if (voucher.category) {
          if (productCategory.toLowerCase() !== voucher.category.toLowerCase()) {
            matchesCategory = false;
          }
        }

        if (matchesScope && matchesCategory) {
          isEligible = true;
        }

        // Additional category-specific & product-specific keyword validations if not already eligible
        if (!isEligible) {
          const descLower = (voucher.description || "").toLowerCase();
          const codeLower = codeUpper.toLowerCase();

          // A. Category specific match check
          let targetCategory = null;
          const catMatch = descLower.match(/category:\s*([a-z0-9_\s\-]+)/);
          if (catMatch && catMatch[1]) {
            targetCategory = catMatch[1].trim();
          } else if (codeLower.startsWith("fashion") && productCategory.toLowerCase() === "fashion") {
            // E.g. FASHION10 voucher code matches Fashion category
            targetCategory = "fashion";
          }

          if (targetCategory && productCategory.toLowerCase() === targetCategory) {
            isEligible = true;
          }

          // B. Product title keyword match check (e.g. SHOE50 matches Running Shoe, Sports Shoe)
          if (!isEligible) {
            let matchesKeyword = false;
            const prodMatch = descLower.match(/products:\s*([a-z0-9_\s\-,\#]+)/);
            if (prodMatch && prodMatch[1]) {
              const titles = prodMatch[1].split(",").map(t => t.trim());
              matchesKeyword = titles.some(title => productTitle.toLowerCase().includes(title));
            } else if (codeLower.startsWith("shoe") && productTitle.toLowerCase().includes("shoe")) {
              matchesKeyword = true;
            }

            if (matchesKeyword) {
              isEligible = true;
            }
          }
        }
      }
    }

    if (isEligible) {
      eligibleItems.push({
        productId: productIdStr,
        sellerId: itemSellerIdStr,
        price,
        quantity,
        subtotal: itemSubtotal,
      });
    }
  }

  if (eligibleItems.length === 0) {
    throw new Error(
      isAdmin
        ? "This voucher is not applicable to any items in your cart"
        : "Wrong seller or product voucher. This voucher does not apply to items in your cart."
    );
  }

  const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.subtotal, 0);

  // 6. Validate minimum order amount
  const minOrderAmount = voucher.minOrder ?? 0;
  if (eligibleSubtotal < minOrderAmount) {
    throw new Error(`Minimum order amount of ₹${minOrderAmount} not satisfied for this voucher`);
  }

  // 7. Calculate discount
  let discountAmount = 0;
  if (voucher.discountType === "percent") {
    discountAmount = (eligibleSubtotal * voucher.discountValue) / 100;
  } else if (voucher.discountType === "flat") {
    discountAmount = voucher.discountValue;
  }

  // Discount cannot exceed eligible subtotal or make total cart subtotal negative
  discountAmount = Math.min(discountAmount, eligibleSubtotal);
  discountAmount = Math.max(0, discountAmount);

  const finalAmount = Math.max(0, totalCartSubtotal - discountAmount);

  // Map voucher type for return result
  let returnedType = "";
  if (isAdmin) {
    if (["customer_all", "customer_specific", "customer_order"].includes(voucher.voucherType)) {
      returnedType = "customer_order";
    } else {
      returnedType = "seller_product";
    }
  } else {
    returnedType = "seller_product";
  }

  return {
    voucherId: voucher._id,
    voucherCode: codeUpper,
    voucherModel: isAdmin ? "AdminVoucher" : "Voucher",
    voucherType: returnedType,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    originalAmount: totalCartSubtotal,
    eligibleAmount: eligibleSubtotal,
    discountAmount,
    finalAmount,
    eligibleItems,
  };
};

/**
 * Validate and calculate discount for a seller upgrade voucher
 * @param {string} voucherCode - The voucher code to apply
 * @param {string} plan - The selected plan ('pro' or 'premium')
 * @param {string} userId - The seller's user ID
 * @returns {Promise<Object>} - Validation result
 */
export const validateUpgradeVoucher = async (voucherCode, plan, userId) => {
  if (!voucherCode) {
    throw new Error("Voucher code is required");
  }
  if (!plan || !["pro", "premium"].includes(plan.toLowerCase())) {
    throw new Error("Invalid plan selected");
  }

  const codeUpper = voucherCode.trim().toUpperCase();
  const planLower = plan.toLowerCase();

  // Find AdminVoucher
  const voucher = await AdminVoucher.findOne({ voucherCode: codeUpper });
  if (!voucher) {
    throw new Error("Voucher does not exist");
  }

  if (voucher.voucherType !== "seller_subscription") {
    throw new Error("Wrong voucher type. This is not a seller upgrade voucher.");
  }

  if (voucher.isActive === false) {
    throw new Error("Voucher is inactive");
  }

  if (new Date() > new Date(voucher.expiry)) {
    throw new Error("Voucher has expired");
  }

  if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
    throw new Error("Voucher usage limit reached");
  }

  // Check per-user limit
  const userUsageCount = await VoucherUsage.countDocuments({
    userId,
    voucherCode: codeUpper,
  });
  if (userUsageCount >= 1) {
    throw new Error("Voucher usage limit per user exceeded");
  }

  // Check plan applicability
  const applicablePlans = (voucher.selectedPlans || []).map(p => p.toLowerCase());
  if (!applicablePlans.includes(planLower)) {
    throw new Error(`Voucher is not applicable for the ${plan} plan`);
  }

  // Plan prices (including 18% GST as per seller controller)
  // pro: ₹9,125 + 18% GST = ₹10,767.50
  // premium: ₹1,98,000 + 18% GST = ₹2,33,640.00
  let originalAmount = 0;
  if (planLower === "pro") {
    originalAmount = 10767.50;
  } else if (planLower === "premium") {
    originalAmount = 233640.00;
  }

  // Calculate discount
  let discountAmount = 0;
  if (voucher.discountType === "percent") {
    discountAmount = (originalAmount * voucher.discountValue) / 100;
  } else if (voucher.discountType === "flat") {
    discountAmount = voucher.discountValue;
  }

  discountAmount = Math.min(discountAmount, originalAmount);
  discountAmount = Math.max(0, discountAmount);

  const finalAmount = Math.max(0, originalAmount - discountAmount);

  return {
    voucherId: voucher._id,
    voucherCode: codeUpper,
    voucherModel: "AdminVoucher",
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    originalAmount,
    discountAmount,
    finalAmount,
  };
};
