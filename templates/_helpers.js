export const appBaseUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

export function formatShippingAddress(address) {
  if (!address) return "—";
  const line1 = address.addressLine1 || address.address || "";
  const line2 = address.addressLine2 ? `, ${address.addressLine2}` : "";
  const city = address.city || "";
  const state = address.state || "";
  const pin = address.pinCode || address.postalCode || "";
  return `${line1}${line2}, ${city}, ${state} - ${pin}`.replace(/^,\s*|,\s*-\s*$/g, "").trim() || "—";
}
