const MOBILE_MAX = 767;
const TABLET_MAX = 1023;

/**
 * Classify client from X-Viewport-Width (preferred) or User-Agent.
 * @returns {'mobile'|'tablet'|'desktop'}
 */
export function getClientDeviceType({ viewportWidth, userAgent = "" } = {}) {
  const width = Number(viewportWidth);
  if (Number.isFinite(width) && width > 0) {
    if (width <= MOBILE_MAX) return "mobile";
    if (width <= TABLET_MAX) return "tablet";
    return "desktop";
  }

  const ua = String(userAgent).toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Default list `limit` when the client did not send one.
 */
export function getDefaultListLimit(deviceType, { mobile = 12, tablet = 16, desktop = 24 } = {}) {
  if (deviceType === "mobile") return mobile;
  if (deviceType === "tablet") return tablet;
  return desktop;
}

/**
 * Cap an explicit limit so mobile clients cannot request huge payloads.
 */
export function capListLimit(deviceType, requestedLimit, { mobile = 24, tablet = 40, desktop = 100 } = {}) {
  const n = Number(requestedLimit);
  if (!Number.isFinite(n) || n < 1) return getDefaultListLimit(deviceType);
  const max = deviceType === "mobile" ? mobile : deviceType === "tablet" ? tablet : desktop;
  return Math.min(Math.floor(n), max);
}
