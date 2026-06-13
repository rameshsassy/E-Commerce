import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import ReferralInvite from "../models/ReferralInvite.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import {
  sendCustomerWelcomeEmail,
  sendSellerWelcomeEmail,
  sendPasswordResetEmail,
} from "../services/email.service.js";
import { generateResetToken } from "../utils/generateResetToken.js";
import { findReferrerByCode, buildReferralCode } from "../utils/sellerReferral.js";
import { logSellerLogin } from "../services/sellerActivity.service.js";
import {
  getPortalFromRequest,
  assertPortalForRole,
  assertPortalAllowsRegistration,
} from "../utils/portalDomains.js";

const buildSafeUser = (user) => {
  const o = {
    _id: user._id,
    firstName: user.firstName,
    email: user.email,
    role: user.role,
    status: user.status,
  };
  if (user.role === "admin_staff") {
    o.adminAccessLevel = user.adminAccessLevel;
    o.adminAllowedSections = user.adminAllowedSections || [];
  }
  return o;
};

export const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

/** Match frontend rules: 8+ chars, uppercase, digit, special @ $ ! % * ? & # */
const isPasswordStrong = (password) =>
  typeof password === "string" &&
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);

const pickRegisterBody = (body) => ({
  firstName: typeof body.firstName === "string" ? body.firstName.trim() : "",
  lastName: typeof body.lastName === "string" ? body.lastName.trim() : "",
  email: normalizeEmail(body.email),
  mobile: typeof body.mobile === "string" ? body.mobile.trim() : "",
  password: body.password,
});

// Helper function to issue tokens and set cookie
export const issueTokensAndSetCookie = async (user, res, req) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt,
    ipAddress: req?.ip || 'Unknown',
    deviceInfo: req?.headers['user-agent'] || 'Unknown'
  });

  const isProd = process.env.NODE_ENV === 'production';
  let sameSite = isProd ? 'strict' : 'lax';
  if (isProd && req?.headers?.origin) {
    try {
      const apiHost = new URL(
        `${req.protocol || 'https'}://${req.get('host')}`
      ).hostname;
      const originHost = new URL(req.headers.origin).hostname;
      if (apiHost !== originHost) sameSite = 'none';
    } catch {
      /* keep strict */
    }
  }

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return accessToken;
};

// ===============================
// ✅ SELLER REGISTER
// ===============================
export const registerSeller = async (req, res) => {
  const { firstName, lastName, email, mobile, password } = pickRegisterBody(req.body);
  const referralInput =
    req.body.referralCode || req.body.ref || req.query?.ref || null;

  try {
    const portal = getPortalFromRequest(req);
    assertPortalAllowsRegistration(portal, "seller");

    if (!process.env.JWT_SECRET) {
      console.error("[auth] JWT_SECRET is not set");
      return res.status(500).json({ message: "Server authentication is not configured." });
    }

    if (!firstName || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (!isPasswordStrong(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include an uppercase letter, a number, and a special character (@$!%*?&#).",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Hold up! This email is already partying in our database. Try logging in instead! 🕺" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let referredBySellerId = null;
    let referrer = null;
    if (referralInput) {
      referrer = await findReferrerByCode(referralInput);
      if (referrer) referredBySellerId = referrer._id;
    }

    let user = null;
    for (let attempt = 0; attempt < 8 && !user; attempt++) {
      try {
        user = await User.create({
          firstName,
          lastName,
          email,
          mobile,
          password: hashedPassword,
          role: "seller",
          status: "pending",
          sellerReferralCode: buildReferralCode(),
          referredBySellerId,
        });
      } catch (createErr) {
        if (createErr?.code === 11000 && createErr?.keyPattern?.sellerReferralCode) {
          continue;
        }
        throw createErr;
      }
    }
    if (!user) {
      return res.status(500).json({ message: "Could not create seller account. Please try again." });
    }

    if (referrer) {
      await User.findByIdAndUpdate(referrer._id, {
        $inc: { referralSignups: 1 },
      });
    }

    // Mark referral invite as signed_up so follow ups stop
    await ReferralInvite.findOneAndUpdate(
      { inviteeEmail: email },
      { status: "signed_up" }
    ).catch((err) => {
      console.error("[auth] Failed to update ReferralInvite status:", err.message);
    });

    console.log(`[auth] User created successfully: ${user._id}`);

    const token = await issueTokensAndSetCookie(user, res, req);

    const safeUser = {
      _id: user._id,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    sendSellerWelcomeEmail(user).catch((err) =>
      console.error("[auth] Seller welcome email failed:", err?.message || err)
    );

    res.status(201).json({
      message: "Seller Registered Successfully",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Seller registration error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({
      message: error.message,
      code: error.code,
      redirectUrl: error.redirectUrl,
    });
  }
};

// ===============================
// ✅ CUSTOMER REGISTER
// ===============================
export const registerCustomer = async (req, res) => {
  const { firstName, lastName, email, mobile, password } = pickRegisterBody(req.body);
  console.log(`[auth] Attempting customer registration for: ${email || "(missing)"}`);

  try {
    const portal = getPortalFromRequest(req);
    assertPortalAllowsRegistration(portal, "customer");

    if (!process.env.JWT_SECRET) {
      console.error("[auth] JWT_SECRET is not set");
      return res.status(500).json({ message: "Server authentication is not configured." });
    }

    if (!firstName || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (!isPasswordStrong(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include an uppercase letter, a number, and a special character (@$!%*?&#).",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Hold up! This email is already partying in our database. Try logging in instead! 🕺" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      mobile,
      password: hashedPassword,
      role: "customer",
      status: "approved",
    });

    const token = await issueTokensAndSetCookie(user, res, req);

    const safeUser = {
      _id: user._id,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    sendCustomerWelcomeEmail(user).catch((err) =>
      console.error("[auth] Customer welcome email failed:", err?.message || err)
    );

    res.status(201).json({
      message: "Customer Registered Successfully",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Customer registration error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✅ ADMIN CREATE
// ===============================
export const createAdmin = async (req, res) => {
  const { firstName, lastName, email, mobile, password, secretKey } = req.body;
  const normalizedEmail = normalizeEmail(email);

  try {
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid admin secret key" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server authentication is not configured." });
    }

    if (!firstName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "Hold up! This email is already partying in our database. Try logging in instead! 🕺" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      mobile,
      password: hashedPassword,
      role: "admin",
      status: "approved",
    });

    const safeAdmin = {
      _id: admin._id,
      firstName: admin.firstName,
      email: admin.email,
      role: admin.role,
    };

    res.status(201).json({
      message: "Admin created successfully",
      admin: safeAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✅ LOGIN
// ===============================
export const loginUser = async (req, res) => {
  const { password } = req.body;
  const rawEmail = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const emailNorm = normalizeEmail(req.body?.email);

  try {
    if (!rawEmail || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email: emailNorm || rawEmail }).collation({
      locale: "en",
      strength: 2,
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    try {
      assertPortalForRole(user.role, getPortalFromRequest(req), req);
    } catch (portalErr) {
      return res.status(portalErr.statusCode || 403).json({
        message: portalErr.message,
        code: portalErr.code,
        redirectUrl: portalErr.redirectUrl,
      });
    }

    const token = await issueTokensAndSetCookie(user, res, req);

    if (user.role === "seller") {
      logSellerLogin(user._id);
    }

    if (user.role === "admin" || user.role === "admin_staff") {
      user.lastLogin = new Date();
      await user.save();
    }

    res.json({
      message: "Login successful",
      token,
      user: buildSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🔄 REFRESH TOKEN
// ===============================
export const refreshTokenHandler = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found. Please log in again." });
  }

  try {
    // Verify token exists in DB and is valid
    const dbToken = await RefreshToken.findOne({ token: refreshToken }).populate('user');

    if (!dbToken) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ message: "Invalid refresh token. Please log in again." });
    }

    // Verify JWT
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        res.clearCookie('refreshToken');
        RefreshToken.deleteOne({ token: refreshToken }).exec(); // clean up
        return res.status(401).json({ message: "Refresh token expired. Please log in again." });
      }

      // Generate new Access Token
      const accessToken = generateAccessToken(dbToken.user);

      res.json({ token: accessToken, user: buildSafeUser(dbToken.user) });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🚪 LOGOUT
// ===============================
export const logoutUser = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  try {
    if (refreshToken) {
      // Remove from DB
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🔑 FORGOT PASSWORD
// ===============================
export const forgotPassword = async (req, res) => {
  const rawEmail = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const emailNorm = normalizeEmail(req.body?.email);

  try {
    if (!rawEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: emailNorm || rawEmail }).collation({
      locale: "en",
      strength: 2,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { token, hashedToken } = generateResetToken();

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // 📧 Send email with token
    sendPasswordResetEmail(user, token).catch((err) =>
      console.log("Password reset email failed:", err.message)
    );

    res.json({
      message: "If a user with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🔄 RESET PASSWORD
// ===============================
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};