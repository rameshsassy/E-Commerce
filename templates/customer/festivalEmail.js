import { appBaseUrl } from "../_helpers.js";

export default function festivalEmail(customerName, headline, bodyHtml, ctaLabel, ctaPath) {
  const base = appBaseUrl();
  const href = ctaPath.startsWith("http") ? ctaPath : `${base}${ctaPath.startsWith("/") ? "" : "/"}${ctaPath}`;
  return `
    <h2>${headline}</h2>
    <p>Hi ${customerName || "there"},</p>
    <div>${bodyHtml}</div>
    <p><a href="${href}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;">${ctaLabel}</a></p>
    <p>— Team Aashansh</p>
  `;
}
