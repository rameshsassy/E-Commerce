import WebsiteRequest from "../models/WebsiteRequest.js";

// Helper to validate email format
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// Helper to validate phone format (e.g. 10 to 15 digits)
const validatePhone = (phone) => {
  const re = /^\+?[0-9\s-]{10,15}$/;
  return re.test(String(phone));
};

/**
 * @desc    Create a new brand website request
 * @route   POST /api/website-requests
 * @access  Private (Seller)
 */
export const createWebsiteRequest = async (req, res) => {
  try {
    const { sellerName, phone, email, brandName, category, message } = req.body;

    // Validation
    if (
      !sellerName?.trim() ||
      !phone?.trim() ||
      !email?.trim() ||
      !brandName?.trim() ||
      !category?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        message: "All fields (Seller Name, Phone, Email, Brand Name, Category, Message) are required.",
      });
    }

    if (!validateEmail(email.trim())) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (!validatePhone(phone.trim())) {
      return res.status(400).json({ message: "Invalid phone number format." });
    }

    const newRequest = await WebsiteRequest.create({
      sellerName: sellerName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      brandName: brandName.trim(),
      category: category.trim(),
      message: message.trim(),
      status: "Pending",
    });

    return res.status(201).json({
      message: "Your website request has been submitted. Our admin team will contact you soon.",
      data: newRequest,
    });
  } catch (error) {
    console.error("createWebsiteRequest Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to submit website request.",
    });
  }
};

/**
 * @desc    Get all website requests
 * @route   GET /api/admin/website-requests
 * @access  Private (Admin)
 */
export const getAllWebsiteRequests = async (req, res) => {
  try {
    const requests = await WebsiteRequest.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("getAllWebsiteRequests Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch website requests.",
    });
  }
};

/**
 * @desc    Update website request status
 * @route   PUT /api/admin/website-requests/:id/status
 * @access  Private (Admin)
 */
export const updateWebsiteRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Contacted", "Completed"].includes(status)) {
      return res.status(400).json({
        message: "Status must be either 'Contacted' or 'Completed'.",
      });
    }

    const request = await WebsiteRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Website request not found." });
    }

    request.status = status;
    await request.save();

    return res.status(200).json({
      message: `Request status updated to ${status} successfully.`,
      data: request,
    });
  } catch (error) {
    console.error("updateWebsiteRequestStatus Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to update website request status.",
    });
  }
};

/**
 * @desc    Delete a website request
 * @route   DELETE /api/admin/website-requests/:id
 * @access  Private (Admin)
 */
export const deleteWebsiteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await WebsiteRequest.findByIdAndDelete(id);

    if (!request) {
      return res.status(404).json({ message: "Website request not found." });
    }

    return res.status(200).json({
      message: "Website request deleted successfully.",
    });
  } catch (error) {
    console.error("deleteWebsiteRequest Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to delete website request.",
    });
  }
};
