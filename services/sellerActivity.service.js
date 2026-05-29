import SellerActivity from "../models/SellerActivity.js";

const MAX_ACTIVITIES_PER_SELLER = 200;
const DEFAULT_LIST_LIMIT = 20;

function truncate(text, max = 80) {
  const s = String(text || "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * Record a seller action (non-blocking). Persisted in DB for later sessions.
 */
export function logSellerActivity(sellerId, payload) {
  if (!sellerId || !payload?.title) return;

  const doc = {
    sellerId,
    type: payload.type || "action",
    title: truncate(payload.title, 500),
    description: payload.description ? truncate(payload.description, 1000) : "",
    link: payload.link || "",
    meta: payload.meta || {},
  };

  setImmediate(async () => {
    try {
      await SellerActivity.create(doc);
      const count = await SellerActivity.countDocuments({ sellerId });
      if (count > MAX_ACTIVITIES_PER_SELLER) {
        const toRemove = count - MAX_ACTIVITIES_PER_SELLER;
        const oldest = await SellerActivity.find({ sellerId })
          .sort({ createdAt: 1 })
          .limit(toRemove)
          .select("_id")
          .lean();
        if (oldest.length) {
          await SellerActivity.deleteMany({
            _id: { $in: oldest.map((o) => o._id) },
          });
        }
      }
    } catch (err) {
      console.error("[sellerActivity] log failed:", err?.message || err);
    }
  });
}

export async function getRecentSellerActivities(sellerId, limit = DEFAULT_LIST_LIMIT) {
  const rows = await SellerActivity.find({ sellerId })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(1, limit), 50))
    .lean();

  return rows.map((row) => ({
    _id: row._id,
    type: row.type,
    title: row.title,
    description: row.description,
    link: row.link,
    meta: row.meta,
    createdAt: row.createdAt,
  }));
}

export const SellerActivityTypes = {
  LOGIN: "login",
  PRODUCT_CREATED: "product_created",
  PRODUCT_UPDATED: "product_updated",
  PRODUCT_DELETED: "product_deleted",
  BULK_UPLOAD: "bulk_upload",
  KYC: "kyc",
  STORE: "store",
  BULK_INQUIRY: "bulk_inquiry",
  ORDER: "order",
  PROFILE: "profile",
  PREMIUM: "premium",
};

export function logSellerLogin(sellerId) {
  logSellerActivity(sellerId, {
    type: SellerActivityTypes.LOGIN,
    title: "Signed in to Seller Hub",
    link: "/seller/dashboard",
  });
}

export function logProductCreated(sellerId, product) {
  logSellerActivity(sellerId, {
    type: SellerActivityTypes.PRODUCT_CREATED,
    title: `Added product: ${truncate(product?.title || "New product")}`,
    description: "Submitted for admin approval",
    link: "/seller/products",
    meta: { productId: product?._id },
  });
}

export function logProductUpdated(sellerId, product) {
  logSellerActivity(sellerId, {
    type: SellerActivityTypes.PRODUCT_UPDATED,
    title: `Updated product: ${truncate(product?.title || "Product")}`,
    link: "/seller/products",
    meta: { productId: product?._id },
  });
}

export function logProductDeleted(sellerId, productTitle, productId) {
  logSellerActivity(sellerId, {
    type: SellerActivityTypes.PRODUCT_DELETED,
    title: `Deleted product: ${truncate(productTitle || "Product")}`,
    link: "/seller/products",
    meta: { productId },
  });
}

export function logBulkProductUpload(sellerId, count) {
  logSellerActivity(sellerId, {
    type: SellerActivityTypes.BULK_UPLOAD,
    title: `Bulk uploaded ${count} product(s)`,
    description: "Pending admin approval",
    link: "/seller/products",
    meta: { count },
  });
}

export function logKycActivity(sellerId, stepLabel) {
  logSellerActivity(sellerId, {
    type: SellerActivityTypes.KYC,
    title: stepLabel,
    link: "/seller/kyc",
  });
}

export function logStoreActivity(sellerId, storeName, isCreate) {
  logSellerActivity(sellerId, {
    type: SellerActivityTypes.STORE,
    title: isCreate
      ? `Created store: ${truncate(storeName)}`
      : `Updated store: ${truncate(storeName)}`,
    link: "/seller/products",
    meta: { storeName },
  });
}

export function logBulkInquiryActivity(sellerId, displayId, action) {
  logSellerActivity(sellerId, {
    type: SellerActivityTypes.BULK_INQUIRY,
    title: `Bulk order ${displayId}: ${action}`,
    link: "/seller/orders-enquiries",
    meta: { displayBulkRequestId: displayId },
  });
}

export function logOrderStatusActivity(sellerId, displayOrderId, status) {
  logSellerActivity(sellerId, {
    type: SellerActivityTypes.ORDER,
    title: `Order ${displayOrderId || ""}: ${status}`.trim(),
    link: "/seller/orders-enquiries",
    meta: { displayOrderId, status },
  });
}

export function logPremiumActivity(sellerId) {
  logSellerActivity(sellerId, {
    type: SellerActivityTypes.PREMIUM,
    title: "Upgraded to Premium seller",
    link: "/seller/premium",
  });
}
