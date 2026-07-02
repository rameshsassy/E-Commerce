import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Seller from "../models/Seller.js";
import bcrypt from "bcryptjs";


// ===============================
// 👤 GET PROFILE (COMMON)
// ===============================
export const getProfile = async (req, res) => {
  try {
    const user = req.user;

    const responseData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
      profilePicture: user.profilePicture,
    };

    if (user.role === "customer" && user.customerId) {
      responseData.customerId = user.customerId;
    }

    if (user.role === "seller") {
      responseData.sellerId = user.sellerId;
      responseData.businessName = user.businessName;
      responseData.address = user.address;
      responseData.city = user.city;
      responseData.state = user.state;
      responseData.pincode = user.pincode;
      responseData.kycStatus = user.kycStatus;
    }

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✏️ UPDATE PROFILE (COMMON)
// ===============================
export const updateProfile = async (req, res) => {
  try {
    const user = req.user;

    const {
      firstName,
      lastName,
      mobile,
      businessName,
      address,
      city,
      state,
      pincode,
      profilePicture,
    } = req.body;

    // Common fields (seller + customer)
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (mobile !== undefined) user.mobile = mobile;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    // Seller-only fields
    if (user.role === "seller") {
      if (businessName !== undefined) user.businessName = businessName;
      if (address !== undefined) user.address = address;
      if (city !== undefined) user.city = city;
      if (state !== undefined) user.state = state;
      if (pincode !== undefined) user.pincode = pincode;
    }

    await user.save();

    const isAutosave = req.method === "PATCH";

    const responseData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
      profilePicture: user.profilePicture,
    };

    if (user.role === "customer" && user.customerId) {
      responseData.customerId = user.customerId;
    }

    if (user.role === "seller") {
      responseData.sellerId = user.sellerId;
      responseData.businessName = user.businessName;
      responseData.address = user.address;
      responseData.city = user.city;
      responseData.state = user.state;
      responseData.pincode = user.pincode;
    }

    res.json({
      message: isAutosave ? "Profile auto-saved" : "Profile updated successfully",
      autoSaved: isAutosave,
      user: responseData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🔑 UPDATE PASSWORD (COMMON)
// ===============================
export const updatePassword = async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    // Fetch user from DB to include password field
    let dbUser = null;
    if (user.role === "admin" || user.role === "admin_staff") {
      dbUser = await User.findById(user._id);
    } else if (user.role === "customer") {
      dbUser = await Customer.findById(user._id);
    } else if (user.role === "seller") {
      dbUser = await Seller.findById(user._id);
    }

    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Validate new password strength
    const isStrong = typeof newPassword === "string" &&
      /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(newPassword);

    if (!isStrong) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include an uppercase letter, a number, and a special character."
      });
    }

    // Hash the new password
    dbUser.password = await bcrypt.hash(newPassword, 10);
    await dbUser.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};