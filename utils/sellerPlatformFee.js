/** Default platform admin cost (%) shown on seller KYC business documents. */
export function getDefaultSellerPlatformFeePercent() {
  const raw = process.env.SELLER_PLATFORM_FEE_PERCENT;
  const n = raw != null ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
  return 12.39;
}

export function parseAdminCostPercentage(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback ?? getDefaultSellerPlatformFeePercent();
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    const err = new Error("Admin cost must be a percentage between 0 and 100.");
    err.statusCode = 400;
    throw err;
  }
  return n;
}
