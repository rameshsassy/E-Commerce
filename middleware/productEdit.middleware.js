import {
  getSupportWhatsAppDisplay,
  getSupportWhatsAppUrl,
} from "../utils/supportContact.js";

export const PRODUCT_LOCKED_CODE = "PRODUCT_LOCKED";

export function isProductLocked(product) {
  return product?.approvalStatus === "approved";
}

export function getProductEditLockPayload() {
  const display = getSupportWhatsAppDisplay();
  return {
    code: PRODUCT_LOCKED_CODE,
    message: `This product has been approved and can no longer be edited. To change product details, please contact us on WhatsApp at ${display}.`,
    whatsappUrl: getSupportWhatsAppUrl(
      "Hi, I need to update details for an approved product on Aashansh."
    ),
    whatsappDisplay: display,
  };
}

export function createProductLockedError() {
  const payload = getProductEditLockPayload();
  const err = new Error(payload.message);
  err.statusCode = 403;
  err.code = payload.code;
  err.whatsappUrl = payload.whatsappUrl;
  err.whatsappDisplay = payload.whatsappDisplay;
  return err;
}

/**
 * Sellers cannot modify product details after admin approval.
 */
export function assertProductEditable(product) {
  if (isProductLocked(product)) {
    throw createProductLockedError();
  }
}

export function sendProductLockedResponse(res, err) {
  if (err?.code === PRODUCT_LOCKED_CODE) {
    return res.status(403).json({
      message: err.message,
      code: err.code,
      whatsappUrl: err.whatsappUrl,
      whatsappDisplay: err.whatsappDisplay,
    });
  }
  return res.status(err.statusCode || 403).json({ message: err.message });
}
