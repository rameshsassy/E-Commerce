import User from "../models/User.js";

// ===============================
// 👤 GET PROFILE (COMMON)
// ===============================
export const getProfile = async (req, res) => {
  try {
    const user = req.user;

    // Safe response (no password)
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status,

      // Seller-specific fields (will be undefined for customers)
      businessName: user.businessName,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
    });
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
    } = req.body;

    // Common fields (seller + customer)
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (mobile !== undefined) user.mobile = mobile;

    // Seller-only fields
    if (user.role === "seller") {
      if (businessName !== undefined) user.businessName = businessName;
      if (address !== undefined) user.address = address;
      if (city !== undefined) user.city = city;
      if (state !== undefined) user.state = state;
      if (pincode !== undefined) user.pincode = pincode;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
        businessName: user.businessName,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};