const MOBILE_MAX = 767;
const TABLET_MAX = 1023;

export function getViewportWidth() {
  if (typeof window === "undefined") return null;
  return window.innerWidth || document.documentElement?.clientWidth || null;
}

/** @returns {'mobile'|'tablet'|'desktop'} */
export function getClientDeviceType(width = getViewportWidth()) {
  const w = Number(width);
  if (!Number.isFinite(w) || w <= 0) return "desktop";
  if (w <= MOBILE_MAX) return "mobile";
  if (w <= TABLET_MAX) return "tablet";
  return "desktop";
}

export function getViewportWidthHeader() {
  const w = getViewportWidth();
  return w != null ? String(Math.round(w)) : undefined;
}
