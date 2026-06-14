function resolveApiBaseUrl() {
  const baked = import.meta.env.VITE_API_BASE_URL;
  const inBrowser = typeof window !== "undefined";

  if (baked && !/localhost|127\.0\.0\.1/i.test(baked)) {
    return baked;
  }

  if (inBrowser) {
    // Relative path /api avoids Private Network Access (PNA) / CORS blocks in the browser
    return "/api";
  }

  // Server-side (SSR) environments fallback
  const serverBase = typeof process !== "undefined" && process.env
    ? (process.env.VITE_API_PROXY_URL || process.env.VITE_API_BASE_URL)
    : undefined;

  return serverBase || "http://localhost:5000/api";
}

export const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let refreshPromise = null;

async function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = fetch(buildUrl("/auth/refresh-token"), {
      method: "POST",
      credentials: "include",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        setTimeout(() => (refreshPromise = null), 0);
      });
  }
  return refreshPromise;
}

function buildUrl(path, params) {
  let base = API_BASE_URL;
  if (!base.startsWith("http")) {
    base = typeof window !== "undefined"
      ? window.location.origin + (base.startsWith("/") ? base : "/" + base)
      : "http://backend:5000/api";
  }

  const url = new URL(
    `${base}${path.startsWith("/") ? path : "/" + path}`
  );
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "")
        url.searchParams.append(k, String(v));
    });
  }
  return url.toString();
}

export async function apiFetch(path, opts = {}) {
  const { json, params, isForm, headers, ...rest } = opts;
  const init = {
    credentials: "include",
    ...rest,
    headers: {
      ...(json && !isForm ? { "Content-Type": "application/json" } : {}),
      Accept: "application/json",
      ...(headers || {}),
    },
    body: isForm ? json : json !== undefined ? JSON.stringify(json) : rest.body,
  };

  let res = await fetch(buildUrl(path, params), init);

  if (res.status === 401 && !path.includes("/auth/")) {
    const ok = await tryRefresh();
    if (ok) res = await fetch(buildUrl(path, params), init);
  }

  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text();

  if (!res.ok) {
    const msg =
      (body && (body.message || body.error)) ||
      `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, body);
  }
  return body;
}

export const api = {
  get: (path, params) => apiFetch(path, { method: "GET", params }),
  post: (path, json) => apiFetch(path, { method: "POST", json }),
  put: (path, json) => apiFetch(path, { method: "PUT", json }),
  patch: (path, json) => apiFetch(path, { method: "PATCH", json }),
  del: (path) => apiFetch(path, { method: "DELETE" }),
  postForm: (path, form) =>
    apiFetch(path, { method: "POST", json: form, isForm: true }),
};
