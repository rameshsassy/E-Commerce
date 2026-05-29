const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const DOMAIN_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function getPlatformStoreHost() {
  const fromEnv = process.env.STORE_PLATFORM_HOST;
  if (fromEnv) return fromEnv.replace(/^https?:\/\//, "").replace(/\/$/, "");
  try {
    const url = new URL(
      process.env.FRONTEND_URL || "http://localhost:5173"
    );
    return url.hostname;
  } catch {
    return "aashansh.org";
  }
}

export function normalizeSubdomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeCustomDomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

export function validateSubdomain(subdomain) {
  const s = normalizeSubdomain(subdomain);
  if (!s || s.length < 3) {
    return { ok: false, message: "Subdomain must be at least 3 characters." };
  }
  if (!SUBDOMAIN_RE.test(s)) {
    return {
      ok: false,
      message:
        "Subdomain can only use lowercase letters, numbers, and hyphens (not at start/end).",
    };
  }
  return { ok: true, value: s };
}

export function validateCustomDomain(domain) {
  const d = normalizeCustomDomain(domain);
  if (!d) {
    return { ok: false, message: "Custom domain is required." };
  }
  if (!DOMAIN_RE.test(d)) {
    return {
      ok: false,
      message: "Enter a valid domain (e.g. shop.yourbrand.com).",
    };
  }
  return { ok: true, value: d };
}

export function buildStorePublicUrl(store) {
  if (!store) return null;
  if (store.domainType === "own_domain" && store.customDomain) {
    return `https://${store.customDomain}`;
  }
  if (store.domainType === "platform_subdomain" && store.subdomain) {
    const base = (process.env.FRONTEND_URL || "http://localhost:5173").replace(
      /\/$/,
      ""
    );
    return `${base}/store/${store.subdomain}`;
  }
  return null;
}

export function getSubdomainPreview(subdomain) {
  const host = getPlatformStoreHost();
  const slug = normalizeSubdomain(subdomain) || "your-store";
  return `https://${host}/store/${slug}`;
}
