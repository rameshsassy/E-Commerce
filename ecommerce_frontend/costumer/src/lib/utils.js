import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL } from "./api";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve a product image path to a fully qualified URL.
 *
 * Images are stored in the DB in two possible formats:
 *   1. Relative path  →  "uploads/products/Aashansh-brand-title-1.jpg"
 *   2. Full HTTPS URL →  "https://lh3.googleusercontent.com/d/<fileId>"  (Google Drive)
 *
 * For relative paths we prepend the backend root URL (VITE_API_BASE_URL with /api stripped).
 * Example: http://localhost:5000/api  →  http://localhost:5000/uploads/products/file.jpg
 * Example: https://api.aashansh.org/api → https://api.aashansh.org/uploads/products/file.jpg
 *
 * Returns "" when imagePath is empty/null (caller can apply its own fallback).
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return "";

  const clean = String(imagePath).trim();

  // Already an absolute URL (Google Drive, CDN, or external) — use as-is
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  // Normalise path separators (Windows backslash → forward slash) and strip leading slashes
  const normalised = clean.replace(/\\/g, "/").replace(/^\/+/, "");

  const uploadPrefixes = ["uploads/", "products/", "kyc/", "stores/", "homepage/", "support/"];
  const isUpload = uploadPrefixes.some((prefix) => normalised.startsWith(prefix));

  if (isUpload) {
    const base = API_BASE_URL.replace(/\/$/, "");
    const cleanNormalised = normalised.startsWith("uploads/") ? normalised : `uploads/${normalised}`;
    return `${base}/${cleanNormalised}`;
  }

  // Fallback to local static asset
  return clean.startsWith("/") ? clean : `/${clean}`;
}

export function parseInternalLink(linkStr) {
  if (!linkStr) return null;
  try {
    let relativeUrl = linkStr;
    if (linkStr.startsWith("http://") || linkStr.startsWith("https://")) {
      const urlObj = new URL(linkStr);
      relativeUrl = urlObj.pathname + urlObj.search;
    }
    const [path, searchStr] = relativeUrl.split("?");
    const searchParams = {};
    if (searchStr) {
      const params = new URLSearchParams(searchStr);
      for (const [key, value] of params.entries()) {
        searchParams[key] = value;
      }
    }
    return {
      to: path || "/",
      search: Object.keys(searchParams).length > 0 ? searchParams : undefined
    };
  } catch (err) {
    return { to: linkStr };
  }
}

