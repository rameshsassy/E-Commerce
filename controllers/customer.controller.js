import {
  ensureCustomerReferralCode,
  customerFrontendBaseUrl,
  customerRegisterUrl,
  getCustomerReferralStats,
  CUSTOMER_REFER_PROGRAM,
} from "../utils/customerReferral.js";
import { sendCustomerReferralInviteEmail } from "../services/email.service.js";
import CustomerReferralInvite from "../models/CustomerReferralInvite.js";
import EmailLog from "../models/EmailLog.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";

export const getCustomerProfile = async (req, res) => {
  try {
    res.json({
      message: "Customer profile fetched",
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCustomerEmailPreferences = async (req, res) => {
  try {
    const { emailNewProductAlerts, marketingEmailsEnabled, marketingEmails } = req.body;
    const user = req.user;
    if (emailNewProductAlerts !== undefined) {
      user.emailNewProductAlerts = Boolean(emailNewProductAlerts);
    }
    const isMarketingEnabled = marketingEmailsEnabled !== undefined ? marketingEmailsEnabled : marketingEmails;
    if (isMarketingEnabled !== undefined) {
      user.marketingEmailsEnabled = Boolean(isMarketingEnabled);
    }
    await user.save();
    res.json({
      message: "Email preferences updated",
      emailNewProductAlerts: user.emailNewProductAlerts,
      marketingEmailsEnabled: user.marketingEmailsEnabled,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🤝 REFER AND EARN
export const getCustomerReferAndEarn = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const referralCode = await ensureCustomerReferralCode(user);
    const frontendBase = customerFrontendBaseUrl(req);
    const deviceType = req.clientDevice || "desktop";
    const stats = await getCustomerReferralStats(user._id, user, {
      limit: 100,
    });

    const senderName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "Customer";

    res.status(200).json({
      message: "Refer and earn fetched successfully",
      data: {
        program: CUSTOMER_REFER_PROGRAM,
        referralCode,
        referralLink: customerRegisterUrl(frontendBase, referralCode),
        senderName,
        stats,
      },
    });
  } catch (error) {
    console.error("[customer] getCustomerReferAndEarn:", error?.message || error);
    res.status(500).json({ message: "Failed to load refer and earn" });
  }
};

export const sendCustomerReferralInvite = async (req, res) => {
  try {
    const {
      inviteeEmail,
      inviteeFirstName,
      inviteeLastName,
      inviteeContact,
    } = req.body || {};

    const rawEmail = typeof inviteeEmail === "string" ? inviteeEmail : "";
    const email = rawEmail.trim().toLowerCase();
    const firstName = typeof inviteeFirstName === "string" ? inviteeFirstName.trim() : "";
    const lastName = typeof inviteeLastName === "string" ? inviteeLastName.trim() : "";
    const contact = typeof inviteeContact === "string" ? inviteeContact.trim() : "";

    if (!email || !firstName) {
      return res.status(400).json({
        message: "Please enter a valid email",
      });
    }

    const hasSpace = rawEmail.includes(" ") || /\s/.test(rawEmail);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    const isValidFormat = emailRegex.test(rawEmail);

    if (hasSpace || !isValidFormat) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    const emailSentEarlier = await EmailLog.exists({ to: email });
    if (emailSentEarlier) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    const userExists = await Customer.exists({ email }) || await User.exists({ email });
    if (userExists) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    const user = req.user;
    if (!user || user.role !== "customer") {
      return res.status(404).json({ message: "Customer not found" });
    }

    const referralCode = await ensureCustomerReferralCode(user);
    const referralLink = customerRegisterUrl(customerFrontendBaseUrl(req), referralCode);
    const senderName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "Aashansh Customer";

    await sendCustomerReferralInviteEmail({
      to: email,
      inviteeFirstName: firstName,
      inviteeLastName: lastName,
      senderName,
      customerFirstName: user.firstName || "Aashansh Customer",
      referralLink,
      referrerId: user._id,
    });

    await CustomerReferralInvite.create({
      referrerId: user._id,
      inviteeEmail: email,
      inviteeFirstName: firstName,
      inviteeLastName: lastName,
      inviteeContact: contact,
      status: "sent",
      followUpCount: 0,
      lastFollowUpSentAt: new Date(),
    }).catch((err) => {
      console.error("[customer] Failed to create CustomerReferralInvite record:", err.message);
    });

    res.status(200).json({
      message: "Invitation email sent successfully",
      data: { inviteeEmail: email },
    });
  } catch (error) {
    console.error("[customer] sendCustomerReferralInvite:", error?.message || error);
    res.status(500).json({
      message: error.message || "Failed to send invitation email",
    });
  }
};