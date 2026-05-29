const LOGO_MIMES = new Set(["image/jpeg", "image/png", "image/jpg"]);
const PDF_MIME = "application/pdf";
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/jpg", "image/webp"]);
const CERT_MIMES = new Set([PDF_MIME, ...IMAGE_MIMES]);

export const KYC_DOCUMENT_FIELDS = [
  "registrationCertificate",
  "orgPanImage",
  "gstImage",
];

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
  if (user.adminCostPercentage == null || user.adminCostPercentage === "") {
    missing.push("adminCostPercentage");
  }
  if (!user.registrationNumber?.trim()) missing.push("registrationNumber");
  if (!user.registrationCertificate) missing.push("registrationCertificate");
  if (!user.orgPanNumber?.trim()) missing.push("orgPanNumber");
  if (!user.orgPanImage) missing.push("orgPanImage");
  if (!user.gstNumber?.trim()) missing.push("gstNumber");
  if (!user.gstImage) missing.push("gstImage");

  if (!user.agreedToTerms) {
    missing.push("agreedToTerms");
  }

  return missing;
}
