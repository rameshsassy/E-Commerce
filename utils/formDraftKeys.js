const FORM_KEY_RE = /^[a-z0-9][a-z0-9._-]{0,119}$/i;

export function normalizeFormKey(raw) {
  if (raw == null) return "";
  return String(raw).trim();
}

export function isValidFormKey(formKey) {
  const key = normalizeFormKey(formKey);
  if (!key || key.length > 120) return false;
  return FORM_KEY_RE.test(key);
}

export function assertValidFormKey(formKey) {
  const key = normalizeFormKey(formKey);
  if (!isValidFormKey(key)) {
    const err = new Error(
      "Invalid form key. Use letters, numbers, dots, dashes, or underscores (max 120 characters)."
    );
    err.statusCode = 400;
    throw err;
  }
  return key;
}
