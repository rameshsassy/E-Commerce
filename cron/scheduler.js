/**
 * Email automation schedules. Enable with ENABLE_EMAIL_CRON=true
 */
import { runWeeklySellerReports } from "./weeklyReports.js";
import { runMonthlySellerInsights } from "./monthlyInsights.js";
import { runAbandonedCartReminders } from "./abandonedCart.js";
import { runThankYouAfterDelivery } from "./thankYouDelay.js";
import { runFestivalCampaign } from "./festivalCampaign.js";
import { runSubscriptionReminders } from "./subscriptionReminders.js";
import { runReferralFollowUps } from "./referralFollowUps.js";

export async function startEmailSchedulers() {
  if (process.env.ENABLE_EMAIL_CRON !== "true") {
    console.log("[cron] Email automation disabled (ENABLE_EMAIL_CRON=true to enable)");
    return;
  }

  let cron;
  try {
    ({ default: cron } = await import("node-cron"));
  } catch {
    console.warn("[cron] node-cron not installed — run: npm install node-cron");
    return;
  }

  cron.schedule("0 9 * * 1", () => {
    runWeeklySellerReports().catch((e) => console.error("[cron] weeklyReports", e));
  });

  cron.schedule("0 10 1 * *", () => {
    runMonthlySellerInsights().catch((e) => console.error("[cron] monthlyInsights", e));
  });

  cron.schedule("15 */3 * * *", () => {
    runAbandonedCartReminders().catch((e) => console.error("[cron] abandonedCart", e));
  });

  cron.schedule("30 */6 * * *", () => {
    runThankYouAfterDelivery().catch((e) => console.error("[cron] thankYou", e));
  });

  cron.schedule("0 11 * * *", () => {
    runFestivalCampaign().catch((e) => console.error("[cron] festival", e));
  });

  cron.schedule("30 9 * * *", () => {
    runSubscriptionReminders().catch((e) => console.error("[cron] subscriptionReminders", e));
  });

  cron.schedule("0 10 * * *", () => {
    runReferralFollowUps().catch((e) => console.error("[cron] referralFollowUps", e));
  });

  console.log("[cron] Email schedulers registered");
}
