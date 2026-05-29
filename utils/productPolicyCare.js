import { hasExternalLinks, htmlToPlainText } from "./productContentValidation.js";

export const POLICY_TERMS_MAX = 150;
export const CARE_INSTRUCTIONS_MAX = 1500;
export const KEY_HIGHLIGHTS_MAX = 1500;

const POLICY_KEYS = ["return", "replacement", "refund"];

export function parsePoliciesInput(input) {
  if (input === undefined || input === null || input === "") {
    return {
      return: { enabled: false, terms: "" },
      replacement: { enabled: false, terms: "" },
      refund: { enabled: false, terms: "" },
    };
  }
  let raw = input;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return parsePoliciesInput(null);
    }
  }
  const out = {};
  for (const key of POLICY_KEYS) {
    const p = raw[key] || {};
    out[key] = {
      enabled: p.enabled === true || p.enabled === "true",
      terms: String(p.terms || "").trim().slice(0, POLICY_TERMS_MAX),
    };
  }
  return out;
}

export function validatePolicyTerms(terms, label) {
  const text = terms != null ? String(terms).trim() : "";
  if (!text) {
    const err = new Error(`${label} policy terms are required when enabled.`);
    err.statusCode = 400;
    throw err;
  }
  if (text.length > POLICY_TERMS_MAX) {
    const err = new Error(
      `${label} policy terms must be ${POLICY_TERMS_MAX} characters or less.`
    );
    err.statusCode = 400;
    throw err;
  }
  if (hasExternalLinks(text)) {
    const err = new Error(`No external links allowed in ${label.toLowerCase()} policy.`);
    err.statusCode = 400;
    throw err;
  }
  return text;
}

export function validatePolicies(policiesInput) {
  const policies = parsePoliciesInput(policiesInput);
  const labels = { return: "Return", replacement: "Replacement", refund: "Refund" };

  for (const key of POLICY_KEYS) {
    if (policies[key].enabled) {
      policies[key].terms = validatePolicyTerms(policies[key].terms, labels[key]);
    } else {
      policies[key].terms = "";
    }
  }
  return policies;
}

export function validateCareInstructions(html) {
  const content = html != null ? String(html) : "";
  const plain = htmlToPlainText(content);
  if (!plain) return "";
  if (plain.length > CARE_INSTRUCTIONS_MAX) {
    const err = new Error(
      `Care instructions must be ${CARE_INSTRUCTIONS_MAX} characters or less.`
    );
    err.statusCode = 400;
    throw err;
  }
  if (hasExternalLinks(plain) || hasExternalLinks(content)) {
    const err = new Error("No external links allowed in care instructions.");
    err.statusCode = 400;
    throw err;
  }
  return content;
}

export function validateKeyHighlights(html) {
  const content = html != null ? String(html) : "";
  const plain = htmlToPlainText(content);
  if (!plain) return "";
  if (plain.length > KEY_HIGHLIGHTS_MAX) {
    const err = new Error(
      `Key highlights must be ${KEY_HIGHLIGHTS_MAX} characters or less.`
    );
    err.statusCode = 400;
    throw err;
  }
  if (hasExternalLinks(plain) || hasExternalLinks(content)) {
    const err = new Error("No external links allowed in key highlights.");
    err.statusCode = 400;
    throw err;
  }
  return content;
}

export function applyPoliciesAndCare(product, body, { sanitizeDescription }) {
  if (body.policies !== undefined) {
    product.policies = validatePolicies(body.policies);
  }
  if (body.careInstructions !== undefined) {
    const validated = validateCareInstructions(body.careInstructions);
    product.careInstructions = validated
      ? sanitizeDescription(validated)
      : "";
  }
  if (body.keyHighlights !== undefined) {
    const validated = validateKeyHighlights(body.keyHighlights);
    product.keyHighlights = validated
      ? sanitizeDescription(validated)
      : "";
  }
}
