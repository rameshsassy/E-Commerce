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

  const base = API_BASE_URL.replace(/\/$/, "");

  if (normalised.startsWith("uploads/")) {
    return `${base}/${normalised}`;
  }
  return `${base}/uploads/${normalised}`;
}

