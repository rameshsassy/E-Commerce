import FAQ from "../models/FAQ.js";
import FAQRequest from "../models/FAQRequest.js";

// ─── Public ───────────────────────────────────────────────────────────────────

/** GET /api/faqs — active FAQs sorted by displayOrder (public, no auth) */
export const getPublicFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select("question answer displayOrder");
    res.json(faqs);
  } catch (err) {
    console.error("getPublicFAQs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** POST /api/faqs/request — submit a question (public, no auth) */
export const submitFAQRequest = async (req, res) => {
  try {
    const { name, email, userType, subject, question } = req.body;

    // Validation
    if (!name || !email || !userType || !subject || !question) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (!["Customer", "Seller"].includes(userType)) {
      return res.status(400).json({ message: "User type must be Customer or Seller" });
    }

    const request = await FAQRequest.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      userType,
      subject: subject.trim(),
      question: question.trim(),
    });

    res.status(201).json({
      message:
        "Your question has been submitted successfully. Our team will review it and publish an answer soon.",
      request,
    });
  } catch (err) {
    console.error("submitFAQRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Admin: FAQ CRUD ──────────────────────────────────────────────────────────

/** GET /api/faqs/admin/all — all FAQs (paginated) */
export const getAllFAQs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status; // "active" | "inactive"

    const filter = {};
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ question: regex }, { answer: regex }];
    }
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const [faqs, total] = await Promise.all([
      FAQ.find(filter)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name firstName lastName"),
      FAQ.countDocuments(filter),
    ]);

    res.json({ faqs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("getAllFAQs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** POST /api/faqs/admin — create FAQ */
export const createFAQ = async (req, res) => {
  try {
    const { question, answer, displayOrder, isActive } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: "Question and answer are required" });
    }

    const faq = await FAQ.create({
      question: question.trim(),
      answer: answer.trim(),
      displayOrder: displayOrder ?? 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    res.status(201).json(faq);
  } catch (err) {
    console.error("createFAQ error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** PUT /api/faqs/admin/:id — update FAQ */
export const updateFAQ = async (req, res) => {
  try {
    const { question, answer, displayOrder, isActive } = req.body;

    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });

    if (question !== undefined) faq.question = question.trim();
    if (answer !== undefined) faq.answer = answer.trim();
    if (displayOrder !== undefined) faq.displayOrder = displayOrder;
    if (isActive !== undefined) faq.isActive = isActive;

    await faq.save();
    res.json(faq);
  } catch (err) {
    console.error("updateFAQ error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** DELETE /api/faqs/admin/:id — delete FAQ */
export const deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });
    res.json({ message: "FAQ deleted" });
  } catch (err) {
    console.error("deleteFAQ error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Admin: FAQ Requests ──────────────────────────────────────────────────────

/** GET /api/faqs/admin/requests — all submitted questions (paginated) */
export const getAllFAQRequests = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status; // "Pending" | "Answered" | "Rejected"

    const filter = {};
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { name: regex },
        { email: regex },
        { subject: regex },
        { question: regex },
      ];
    }
    if (status && ["Pending", "Answered", "Rejected"].includes(status)) {
      filter.status = status;
    }

    const [requests, total] = await Promise.all([
      FAQRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      FAQRequest.countDocuments(filter),
    ]);

    res.json({ requests, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("getAllFAQRequests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** PUT /api/faqs/admin/requests/:id/answer — answer a question */
export const answerFAQRequest = async (req, res) => {
  try {
    const { answer, publishAsFAQ } = req.body;

    if (!answer) {
      return res.status(400).json({ message: "Answer is required" });
    }

    const request = await FAQRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.answer = answer.trim();
    request.status = "Answered";
    await request.save();

    // Optionally create a new FAQ from this answer
    let newFaq = null;
    if (publishAsFAQ) {
      const maxOrder = await FAQ.findOne().sort({ displayOrder: -1 }).select("displayOrder");
      newFaq = await FAQ.create({
        question: request.question,
        answer: answer.trim(),
        isActive: true,
        displayOrder: (maxOrder?.displayOrder || 0) + 1,
        createdBy: req.user._id,
      });
    }

    res.json({
      message: "Question answered successfully",
      request,
      ...(newFaq && { newFaq }),
    });
  } catch (err) {
    console.error("answerFAQRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** PUT /api/faqs/admin/requests/:id/reject — reject a question */
export const rejectFAQRequest = async (req, res) => {
  try {
    const request = await FAQRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "Rejected";
    await request.save();

    res.json({ message: "Question rejected", request });
  } catch (err) {
    console.error("rejectFAQRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** DELETE /api/faqs/admin/requests/:id — delete a question */
export const deleteFAQRequest = async (req, res) => {
  try {
    const request = await FAQRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Request deleted" });
  } catch (err) {
    console.error("deleteFAQRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
