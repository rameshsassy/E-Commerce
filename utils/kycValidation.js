const LOGO_MIMES = new Set(["image/jpeg", "image/png", "image/jpg"]);
const PDF_MIME = "application/pdf";
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/jpg", "image/webp"]);
const CERT_MIMES = new Set([PDF_MIME, ...IMAGE_MIMES]);

export const KYC_DOCUMENT_FIELDS = [
  "registrationCertificate",
  "orgPanImage",
  "gstImage",
];

// ─── PAN & GST validation ────────────────────────────────────────────────────

/**
 * Indian PAN format: AAAAA9999A  (5 letters, 4 digits, 1 letter)
 * Max 10 alphanumeric characters.
 */
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

/**
 * Indian GSTIN format: 22AAAAA0000A1Z5
 * 2 digits (state) + 10-char PAN + 1 alphanumeric + Z + 1 alphanumeric
 * Max 15 alphanumeric characters.
 */
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

/**
 * Validate a PAN number string.
 * @param {string} pan
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePanNumber(pan) {
  if (!pan || !pan.trim()) {
    return { valid: false, message: "PAN number is required." };
  }
  const trimmed = pan.trim();
  if (trimmed.length > 10) {
    return { valid: false, message: "PAN number must be max 10 characters." };
  }
  if (!PAN_REGEX.test(trimmed)) {
    return { valid: false, message: "Oops! Please mention the correct PAN" };
  }
  return { valid: true, message: "Perfect! This looks good" };
}

/**
 * Validate a GST number string (optional — only validated when provided).
 * @param {string} gst
 * @returns {{ valid: boolean, message: string }}
 */
export function validateGstNumber(gst) {
  if (!gst || !gst.trim()) {
    // GST is optional, so empty is valid
    return { valid: true, message: "" };
  }
  const trimmed = gst.trim();
  if (trimmed.length > 15) {
    return { valid: false, message: "GST number must be max 15 characters." };
  }
  if (!GST_REGEX.test(trimmed)) {
    return { valid: false, message: "Oops! Please mention the correct GST" };
  }
  return { valid: true, message: "Perfect! This looks good" };
}

// ─── File-type checks ────────────────────────────────────────────────────────

export function isKycLogoFile(file) {
  if (!file) return false;
  return LOGO_MIMES.has(file.mimetype);
}

export function isKycPdfFile(file) {
  if (!file) return false;
  return file.mimetype === PDF_MIME;
}

export function isKycImageFile(file) {
  if (!file) return false;
  return IMAGE_MIMES.has(file.mimetype);
}

export function isKycCertificateFile(file) {
  if (!file) return false;
  return CERT_MIMES.has(file.mimetype);
}

export function assertKycLogoUpload(file) {
  if (!file) {
    const err = new Error("Organization logo is required (PNG or JPG).");
    err.statusCode = 400;
    throw err;
  }
  if (!isKycLogoFile(file)) {
    const err = new Error("Organization logo must be PNG or JPG format.");
    err.statusCode = 400;
    throw err;
  }
}

export function assertKycCertificateUpload(file, label) {
  if (!file) {
    const err = new Error(`${label} is required.`);
    err.statusCode = 400;
    throw err;
  }
  if (!isKycCertificateFile(file)) {
    const err = new Error(`${label} must be a PDF or image file (JPG, PNG, or WebP).`);
    err.statusCode = 400;
    throw err;
  }
}

export function assertKycImageUpload(file, label) {
  if (!file) {
    const err = new Error(`${label} is required.`);
    err.statusCode = 400;
    throw err;
  }
  if (!isKycImageFile(file)) {
    const err = new Error(`${label} must be an image file (JPG, PNG, or WebP).`);
    err.statusCode = 400;
    throw err;
  }
}

/** @deprecated use assertKycCertificateUpload or assertKycImageUpload */
export function assertKycPdfUpload(file, label) {
  assertKycCertificateUpload(file, label);
}

export function getKycMissingFields(user, { requireNewLogo = false } = {}) {
  const missing = [];

  if (!user.officialName?.trim()) missing.push("officialName");
  if (!user.entityType?.trim()) missing.push("entityType");
  if (!user.elevatorPitch?.trim()) missing.push("elevatorPitch");
  if (!user.storeAddresses?.length) missing.push("storeAddresses");
  if (requireNewLogo && !user.organizationLogo) missing.push("organizationLogo");
  if (!user.organizationLogo) missing.push("organizationLogo");

  if (!user.dateOfRegistration) missing.push("dateOfRegistration");
  // adminCostPercentage is removed — no longer required
  if (!user.registrationNumber?.trim()) missing.push("registrationNumber");
  if (!user.registrationCertificate) missing.push("registrationCertificate");
  if (!user.orgPanNumber?.trim()) missing.push("orgPanNumber");
  if (!user.orgPanImage) missing.push("orgPanImage");
  // GST is optional — not required for KYC submission
  // gstNumber and gstImage are NOT checked here

  if (!user.agreedToTerms) {
    missing.push("agreedToTerms");
  }

  return missing;
}
