import User from "../models/User.js";
import { sendFestivalCampaignEmail } from "../services/email.service.js";

/**
 * Set env: FESTIVAL_EMAIL_ACTIVE=true FESTIVAL_EMAIL_SUBJECT="..." FESTIVAL_EMAIL_HEADLINE="..."
 * FESTIVAL_EMAIL_BODY="<p>...</p>" FESTIVAL_EMAIL_CTA_LABEL="Shop" FESTIVAL_EMAIL_CTA_PATH="/products"
 * Runs on schedule only when cron enabled — use a narrow cron window or toggle env off after send.
 */
export async function runFestivalCampaign() {
  if (process.env.FESTIVAL_EMAIL_ACTIVE !== "true") return;

  const headline = process.env.FESTIVAL_EMAIL_HEADLINE || "Season's greetings from Aashansh";
  const bodyHtml =
    process.env.FESTIVAL_EMAIL_BODY ||
    "<p>We're celebrating with curated offers across the marketplace. Explore handcrafted picks today.</p>";

  const customers = await User.find({
    role: "customer",
    marketingEmailsEnabled: true,
  })
    .select("firstName email")
    .limit(500);

  const campaign = {
    id: "festival",
    subject: process.env.FESTIVAL_EMAIL_SUBJECT || "Something special at Aashansh",
    headline,
    bodyHtml,
    ctaLabel: process.env.FESTIVAL_EMAIL_CTA_LABEL || "Browse products",
    ctaPath: process.env.FESTIVAL_EMAIL_CTA_PATH || "/products",
  };

  for (const c of customers) {
    await sendFestivalCampaignEmail(c, campaign).catch(() => {});
  }
}
