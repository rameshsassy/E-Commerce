import User from "../models/User.js";
import { sendSubscriptionReminderEmail } from "../services/email.service.js";
import EmailLog from "../models/EmailLog.js";

/**
 * Check if a reminder of the specified templateType has already been sent
 * to the seller in their current 365-day subscription cycle.
 */
async function hasSentReminderThisCycle(seller, templateType) {
  if (!seller.subscriptionValidUntil) return false;
  
  // Calculate the approximate start of the current subscription cycle.
  // Standard subscription is 365 days; we look back 366 days from the expiration date.
  const cycleStart = new Date(seller.subscriptionValidUntil.getTime() - 366 * 24 * 60 * 60 * 1000);
  
  const log = await EmailLog.findOne({
    templateType,
    to: seller.email,
    status: "sent",
    createdAt: { $gte: cycleStart }
  });
  
  return !!log;
}

/**
 * Main function to evaluate all premium/subscribed sellers and process reminders and expiries.
 */
export async function runSubscriptionReminders() {
  console.log("[cron] Running subscription reminders job...");
  const now = new Date();

  // Find all sellers who have ever taken a premium plan (i.e., sellerType is premium)
  const sellers = await User.find({
    role: "seller",
    sellerType: "premium",
    subscriptionValidUntil: { $ne: null }
  });

  console.log(`[cron] Found ${sellers.length} premium sellers to evaluate.`);

  for (const seller of sellers) {
    try {
      const validUntil = new Date(seller.subscriptionValidUntil);
      // Diff in ms, then convert to days (ceiling ensures we count days accurately)
      const diffTime = validUntil.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      console.log(`[cron] Seller ${seller.email}: subscriptionActive=${seller.subscriptionActive}, daysLeft=${daysLeft}`);

      if (daysLeft <= 0) {
        // Handle Expiration
        if (seller.subscriptionActive) {
          console.log(`[cron] Subscription expired for ${seller.email}. Deactivating...`);
          seller.subscriptionActive = false;
          seller.bulkPurchaseEnabled = false;
          await seller.save();
        }

        const templateType = "seller_subscription_expired";
        const alreadySent = await hasSentReminderThisCycle(seller, templateType);
        if (!alreadySent) {
          console.log(`[cron] Sending expiry email to ${seller.email}...`);
          await sendSubscriptionReminderEmail(seller, "expired");
        }
      } else if (seller.subscriptionActive) {
        // Handle active reminders
        if (daysLeft <= 1 && daysLeft > 0) {
          const templateType = "seller_subscription_1_day";
          const alreadySent = await hasSentReminderThisCycle(seller, templateType);
          if (!alreadySent) {
            console.log(`[cron] Sending 1-day reminder to ${seller.email}...`);
            await sendSubscriptionReminderEmail(seller, "1_day");
          }
        } else if (daysLeft <= 5 && daysLeft > 1) {
          const templateType = "seller_subscription_5_days";
          const alreadySent = await hasSentReminderThisCycle(seller, templateType);
          if (!alreadySent) {
            console.log(`[cron] Sending 5-day reminder to ${seller.email}...`);
            await sendSubscriptionReminderEmail(seller, "5_days");
          }
        } else if (daysLeft <= 10 && daysLeft > 5) {
          const templateType = "seller_subscription_10_days";
          const alreadySent = await hasSentReminderThisCycle(seller, templateType);
          if (!alreadySent) {
            console.log(`[cron] Sending 10-day reminder to ${seller.email}...`);
            await sendSubscriptionReminderEmail(seller, "10_days");
          }
        } else if (daysLeft <= 15 && daysLeft > 10) {
          const templateType = "seller_subscription_15_days";
          const alreadySent = await hasSentReminderThisCycle(seller, templateType);
          if (!alreadySent) {
            console.log(`[cron] Sending 15-day reminder to ${seller.email}...`);
            await sendSubscriptionReminderEmail(seller, "15_days");
          }
        } else if (daysLeft <= 30 && daysLeft > 15) {
          const templateType = "seller_subscription_30_days";
          const alreadySent = await hasSentReminderThisCycle(seller, templateType);
          if (!alreadySent) {
            console.log(`[cron] Sending 30-day reminder to ${seller.email}...`);
            await sendSubscriptionReminderEmail(seller, "30_days");
          }
        }
      }
    } catch (err) {
      console.error(`[cron] Error processing subscription reminders for ${seller.email}:`, err);
    }
  }
  console.log("[cron] Finished running subscription reminders job.");
}
