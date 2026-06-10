import { getApprovedProductWhatsAppUrl, getSupportWhatsAppDisplay } from './supportContact';

export function isProductLocked(product) {
  return product?.approvalStatus === 'approved';
}

export function getProductLockMessage(productTitle) {
  const display = getSupportWhatsAppDisplay();
  const title = String(productTitle || '').trim();
  if (title) {
    return `"${title}" has been approved and cannot be edited here. Contact us on WhatsApp at ${display} to request changes.`;
  }
  return `Approved products cannot be edited here. Contact us on WhatsApp at ${display} to request changes.`;
}

export function getProductLockWhatsAppUrl(product) {
  return getApprovedProductWhatsAppUrl(product?.title);
}

export function isProductLockedApiError(err) {
  return err?.response?.data?.code === 'PRODUCT_LOCKED';
}

export function getApiLockPayload(err) {
  const data = err?.response?.data;
  if (!data || data.code !== 'PRODUCT_LOCKED') return null;
  return {
    message: data.message,
    whatsappUrl: data.whatsappUrl,
    whatsappDisplay: data.whatsappDisplay,
  };
}
