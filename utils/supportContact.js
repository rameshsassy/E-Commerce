/**
 * Platform support contact (WhatsApp) for seller product change requests.
 */

const DEFAULT_WHATSAPP = "919876543210";

export function getSupportWhatsAppNumber() {
  const raw =
    process.env.SUPPORT_WHATSAPP_NUMBER ||
    process.env.WHATSAPP_SUPPORT_NUMBER ||
    DEFAULT_WHATSAPP;
  return String(raw).replace(/\D/g, "");
}

export function getSupportWhatsAppDisplay() {
  const digits = getSupportWhatsAppNumber();
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `+${digits}`;
}

export function getSupportWhatsAppUrl(text = "") {
  const digits = getSupportWhatsAppNumber();
  const base = `https://wa.me/${digits}`;
  const msg = String(text || "").trim();
  if (!msg) return base;
  return `${base}?text=${encodeURIComponent(msg)}`;
}
