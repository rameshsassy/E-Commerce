import mongoose from "mongoose";
import Product from "../models/Product.js";

// ===============================
// 📊 SELLER DASHBOARD
// ===============================
export const getDashboard = async (req, res) => {
  try {
    if (req.user.status !== "approved") {
      return res.status(403).json({
        message: "Complete approval to access dashboard",
      });
    }

    const sellerId = new mongoose.Types.ObjectId(req.user._id);

    const stats = await Product.aggregate([
      {
        $match: {
          sellerId: sellerId,
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: "$stock" },
          totalValue: {
            $sum: { $multiply: ["$price", "$stock"] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
    };

    res.status(200).json({
      message: "Dashboard fetched successfully",
      data: result,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
};

// ===============================
// 👤 GET SELLER PROFILE
// ===============================
export const getSellerProfile = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      businessName: user.businessName,
      organizationLogo: user.organizationLogo,
      elevatorPitch: user.elevatorPitch,
      officialName: user.officialName,
      entityType: user.entityType,
      storeAddresses: user.storeAddresses,
      registrationNumber: user.registrationNumber,
      registrationCertificate: user.registrationCertificate,
      orgPanNumber: user.orgPanNumber,
      orgPanImage: user.orgPanImage,
      cancelledCheckImage: user.cancelledCheckImage,
      gstNumber: user.gstNumber,
      gstImage: user.gstImage,
      agreedToTerms: user.agreedToTerms,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      status: user.status,
      kycStatus: user.kycStatus, // ✅ added
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📦 GET SELLER PRODUCTS
// ===============================
export const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✏️ UPDATE SELLER PROFILE
// ===============================
export const updateSellerProfile = async (req, res) => {
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

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.mobile = mobile || user.mobile;
    user.businessName = businessName || user.businessName;
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.pincode = pincode || user.pincode;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📄 SUBMIT KYC
// ===============================
export const submitKYC = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({
        message: "Only sellers can submit KYC",
      });
    }

    const { panNumber, aadhaarNumber } = req.body;

    if (!panNumber || !aadhaarNumber) {
      return res.status(400).json({
        message: "PAN and Aadhaar are required",
      });
    }

    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        message: "Upload PAN and Aadhaar images",
      });
    }

    const panImage = req.files[0].path;
    const aadhaarImage = req.files[1].path;

    user.panNumber = panNumber;
    user.aadhaarNumber = aadhaarNumber;
    user.panImage = panImage;
    user.aadhaarImage = aadhaarImage;

    user.kycStatus = "pending";
    user.status = "kyc_submitted";

    await user.save();

    res.json({
      message: "KYC submitted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🚀 SUBMIT KYC STEP 1 (Organization Details)
// ===============================
export const submitKycStep1 = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({
        message: "Only sellers can submit KYC",
      });
    }

    const { elevatorPitch, officialName, entityType, storeAddresses } = req.body;
    
    // Logo is optional during this step, but typically required
    let organizationLogo = user.organizationLogo;
    if (req.file) {
      organizationLogo = req.file.path;
    }

    // Update user details
    user.elevatorPitch = elevatorPitch || user.elevatorPitch;
    user.officialName = officialName || user.officialName;
    user.entityType = entityType || user.entityType;
    
    if (storeAddresses) {
      // Expecting storeAddresses to be an array of strings, or a single string
      user.storeAddresses = Array.isArray(storeAddresses) ? storeAddresses : [storeAddresses];
    }
    
    user.organizationLogo = organizationLogo;

    // Optional: we could change user.kycStatus = "step1_completed" or keep it as is
    // Let's just save the updated info for now
    await user.save();

    res.json({
      message: "Organization details saved successfully",
      organizationLogo: user.organizationLogo,
      elevatorPitch: user.elevatorPitch,
      officialName: user.officialName,
      entityType: user.entityType,
      storeAddresses: user.storeAddresses,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🚀 SUBMIT KYC STEP 2 (Business Documents)
// ===============================
export const submitKycStep2 = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({
        message: "Only sellers can submit KYC",
      });
    }

    const { dateOfRegistration, adminCostPercentage, registrationNumber, orgPanNumber, gstNumber, agreedToTerms } = req.body;

    // Update text fields
    user.dateOfRegistration = dateOfRegistration || user.dateOfRegistration;
    if (adminCostPercentage !== undefined) user.adminCostPercentage = Number(adminCostPercentage);
    user.registrationNumber = registrationNumber || user.registrationNumber;
    user.orgPanNumber = orgPanNumber || user.orgPanNumber;
    user.gstNumber = gstNumber || user.gstNumber;
    
    if (agreedToTerms !== undefined) {
      user.agreedToTerms = agreedToTerms === 'true' || agreedToTerms === true;
    }

    // Update files if provided
    if (req.files) {
      if (req.files.registrationCertificate && req.files.registrationCertificate[0]) {
        user.registrationCertificate = req.files.registrationCertificate[0].path;
      }
      if (req.files.orgPanImage && req.files.orgPanImage[0]) {
        user.orgPanImage = req.files.orgPanImage[0].path;
      }
      if (req.files.cancelledCheckImage && req.files.cancelledCheckImage[0]) {
        user.cancelledCheckImage = req.files.cancelledCheckImage[0].path;
      }
      if (req.files.gstImage && req.files.gstImage[0]) {
        user.gstImage = req.files.gstImage[0].path;
      }
    }

    await user.save();

    res.json({
      message: "Business documents saved successfully",
      registrationNumber: user.registrationNumber,
      registrationCertificate: user.registrationCertificate,
      orgPanNumber: user.orgPanNumber,
      orgPanImage: user.orgPanImage,
      cancelledCheckImage: user.cancelledCheckImage,
      gstNumber: user.gstNumber,
      gstImage: user.gstImage,
      agreedToTerms: user.agreedToTerms,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✅ FINALIZE KYC (Submit for Verification)
// ===============================
export const finalizeKyc = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can submit KYC" });
    }

    // Check required fields
    const requiredFields = {
      organizationLogo: user.organizationLogo,
      elevatorPitch: user.elevatorPitch,
      officialName: user.officialName,
      entityType: user.entityType,
      storeAddresses: user.storeAddresses && user.storeAddresses.length > 0 ? true : null,
      dateOfRegistration: user.dateOfRegistration,
      adminCostPercentage: user.adminCostPercentage !== undefined ? true : null,
      registrationNumber: user.registrationNumber,
      registrationCertificate: user.registrationCertificate,
      orgPanNumber: user.orgPanNumber,
      orgPanImage: user.orgPanImage,
      cancelledCheckImage: user.cancelledCheckImage,
    };

    const missingFields = [];
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        missingFields.push(key);
      }
    }

    if (!user.agreedToTerms) {
      missingFields.push("agreedToTerms (must agree to terms and conditions)");
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Please fill all required fields before submitting.",
        missingFields,
      });
    }

    // If everything is valid, update statuses
    user.kycStatus = "pending"; // Pending admin approval
    user.status = "kyc_submitted";

    await user.save();

    res.json({
      message: "KYC submitted successfully for verification!",
      kycStatus: user.kycStatus,
      status: user.status,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};