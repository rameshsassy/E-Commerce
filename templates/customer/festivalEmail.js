import { appBaseUrl, wrapCustomerEmail } from "../_helpers.js";

export default function festivalEmail(customerName, headline, bodyHtml, ctaLabel, ctaPath) {
  const base = appBaseUrl();
  const href = ctaPath.startsWith("http") ? ctaPath : `${base}${ctaPath.startsWith("/") ? "" : "/"}${ctaPath}`;
  const inner = `
    <h2>${headline}</h2>
    <p>Hi ${customerName || "there"},</p>
    <div>${bodyHtml}</div>
    <p><a href="${href}" style="display:inline-block;padding:12px 24px;background:#FFD600;color:#333;text-decoration:none;border-radius:25px;font-weight:bold;">${ctaLabel}</a></p>
    <p>— Team Aashansh</p>
  `;
  return wrapCustomerEmail(inner);
}
