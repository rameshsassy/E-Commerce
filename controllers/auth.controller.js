import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import generateToken from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
  customerWelcomeTemplate,
  sellerWelcomeTemplate,
} from "../utils/emailTemplates.js";
import { generateResetToken } from "../utils/generateResetToken.js";

// ===============================
// ✅ SELLER REGISTER
// ===============================
export const registerSeller = async (req, res) => {
  const { firstName, lastName, email, mobile, password } = req.body;

  try {
    if (!firstName || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
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
      role: "seller",
      status: "pending",
    });

    // 📩 Email (non-blocking)
    sendEmail({
      to: user.email,
      subject: "Welcome Seller 🚀",
      html: sellerWelcomeTemplate(
        user.firstName,
        `${process.env.FRONTEND_URL}/seller/dashboard`
      ),
    }).catch((err) => console.log("Email failed:", err.message));

    const safeUser = {
      _id: user._id,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    res.status(201).json({
      message: "Seller registered successfully",
      token: generateToken(user),
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✅ CUSTOMER REGISTER
// ===============================
export const registerCustomer = async (req, res) => {
  const { firstName, lastName, email, mobile, password } = req.body;

  try {
    if (!firstName || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
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

    // 📩 Email (non-blocking)
    sendEmail({
      to: user.email,
      subject: "Welcome to Aashansh 🛒",
      html: customerWelcomeTemplate(
        user.firstName,
        process.env.FRONTEND_URL
      ),
    }).catch((err) => console.log("Email failed:", err.message));

    const safeUser = {
      _id: user._id,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    res.status(201).json({
      message: "Customer registered successfully",
      token: generateToken(user),
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✅ ADMIN CREATE
// ===============================
export const createAdmin = async (req, res) => {
  const { firstName, lastName, email, mobile, password, secretKey } = req.body;

  try {
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid admin secret key" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Hold up! This email is already partying in our database. Try logging in instead! 🕺" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      firstName,
      lastName,
      email,
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
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const safeUser = {
      _id: user._id,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🔑 FORGOT PASSWORD
// ===============================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { token, hashedToken } = generateResetToken();

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    res.json({
      message: "Reset token generated",
      resetToken: token, // temp (replace with email later)
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