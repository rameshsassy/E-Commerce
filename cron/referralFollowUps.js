import ReferralInvite from "../models/ReferralInvite.js";
import User from "../models/User.js";
import { sendSellerReferralFollowUpEmail } from "../services/email.service.js";
import { sellerRegisterUrl, ensureSellerReferralCode } from "../utils/sellerReferral.js";

/**
 * Iterates through all referral invites currently in 'sent' status
 * and evaluates if they should receive the next follow-up email.
 */
export async function runReferralFollowUps() {
  console.log("[cron] Running referral follow-up emails job...");
  const now = new Date();

  // Find all pending invites (status = sent, followUpCount < 4)
  const invites = await ReferralInvite.find({
    status: "sent",
    followUpCount: { $lt: 4 },
  }).populate("referrerId");

  console.log(`[cron] Found ${invites.length} pending referral invites to evaluate.`);

  for (const invite of invites) {
    try {
      const referrer = invite.referrerId;
      if (!referrer) {
        console.warn(`[cron] Referrer not found for invite to ${invite.inviteeEmail}`);
        continue;
      }

      // Check if the invitee has already registered (safety fallback)
      const registeredUser = await User.exists({ email: invite.inviteeEmail.toLowerCase() });
      if (registeredUser) {
        console.log(`[cron] Invitee ${invite.inviteeEmail} has signed up. Updating status.`);
        invite.status = "signed_up";
        await invite.save();
        continue;
      }

      const lastSent = invite.lastFollowUpSentAt || invite.createdAt;
      const diffMs = now.getTime() - lastSent.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      let sendStep = 0;
      let minDaysRequired = 0;

      if (invite.followUpCount === 0) {
        sendStep = 1;
        minDaysRequired = 1; // 1 day after initial invite
      } else if (invite.followUpCount === 1) {
        sendStep = 2;
        minDaysRequired = 2; // 2 days after follow up 1
      } else if (invite.followUpCount === 2) {
        sendStep = 3;
        minDaysRequired = 3; // 3 days after follow up 2
      } else if (invite.followUpCount === 3) {
        sendStep = 4;
        minDaysRequired = 4; // 4 days after follow up 3
      }

      if (sendStep > 0 && diffDays >= minDaysRequired) {
        console.log(`[cron] Sending Follow Up ${sendStep} to ${invite.inviteeEmail}`);

        const referralCode = await ensureSellerReferralCode(referrer);
        const referralLink = sellerRegisterUrl(null, referralCode);

        await sendSellerReferralFollowUpEmail({
          to: invite.inviteeEmail,
          step: sendStep,
          inviteeFirstName: invite.inviteeFirstName,
          inviteeVenture: invite.inviteeVenture,
          referralCode,
          referralLink,
        });

        invite.followUpCount = sendStep;
        invite.lastFollowUpSentAt = now;
        await invite.save();
      }
    } catch (err) {
      console.error(`[cron] Error processing referral follow up for ${invite.inviteeEmail}:`, err);
    }
  }

  console.log("[cron] Finished running referral follow-up emails job.");
}
