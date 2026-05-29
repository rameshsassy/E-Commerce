const DEFAULT_WHATSAPP = '919876543210';

export function getSupportWhatsAppDigits() {
  const raw =
    import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER ||
    import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER ||
    DEFAULT_WHATSAPP;
  return String(raw).replace(/\D/g, '');
}

export function getSupportWhatsAppDisplay() {
  const digits = getSupportWhatsAppDigits();
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `+${digits}`;
}

export function getSupportWhatsAppUrl(prefill = '') {
  const digits = getSupportWhatsAppDigits();
  const base = `https://wa.me/${digits}`;
  const text = String(prefill || '').trim();
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function getApprovedProductWhatsAppUrl(productTitle = '') {
  const title = String(productTitle || '').trim();
  const msg = title
    ? `Hi, I need to update details for my approved product "${title}" on Aashansh.`
    : 'Hi, I need to update details for an approved product on Aashansh.';
  return getSupportWhatsAppUrl(msg);
}
