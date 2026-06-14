// Customer API client. Uses HttpOnly cookies (credentials: include) and auto refreshes on 401.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh-token`, {
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
  const url = new URL(
    `${API_BASE_URL}${path.startsWith("/") ? path : "/" + path}`,
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
