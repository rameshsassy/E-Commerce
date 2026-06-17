import Policy from "../models/Policy.js";
import sanitizeHtml from "sanitize-html";

// Helper to sanitize editor content
const sanitizePolicyContent = (content) => {
  if (!content) return "";
  return sanitizeHtml(content, {
    allowedTags: [
      "address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4",
      "h5", "h6", "hgroup", "main", "nav", "section", "blockquote", "dd", "div",
      "dl", "dt", "figcaption", "figure", "hr", "li", "main", "ol", "p", "pre",
      "ul", "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
      "em", "i", "kbd", "mark", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp",
      "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", "font"
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      font: ["size", "color", "face"],
      span: ["style"],
      p: ["style"],
      div: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      h5: ["style"],
      h6: ["style"]
    },
    allowedStyles: {
      "*": {
        "color": [/^#/g, /^rgb/g, /^hsl/g, /^[a-z]+/i],
        "background-color": [/^#/g, /^rgb/g, /^hsl/g, /^[a-z]+/i],
        "font-size": [/^\d+(px|em|rem|pt|%)?$/i],
        "text-align": [/^left$/i, /^right$/i, /^center$/i, /^justify$/i],
        "font-weight": [/^[a-z0-9]+/i],
        "text-decoration": [/^underline$/i, /^line-through$/i, /^none$/i]
      }
    }
  });
};

// ─── Public APIs ─────────────────────────────────────────────────────────────

/** GET /api/policies — Get all active policies */
export const getPublicPolicies = async (req, res) => {
  try {
    const policies = await Policy.find({ status: "active" })
      .select("title type status updatedAt")
      .sort({ title: 1 });
    res.json(policies);
  } catch (err) {
    console.error("getPublicPolicies error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** GET /api/policies/:type — Get single active policy by type */
export const getPublicPolicyByType = async (req, res) => {
  try {
    const { type } = req.params;
    // Map URL friendly slug format back to DB enum format if necessary (e.g. refund-policy -> refund_policy)
    const normalizedType = type.replace(/-/g, "_");

    const policy = await Policy.findOne({ type: normalizedType, status: "active" });
    if (!policy) {
      return res.status(404).json({ message: "This policy is currently not available." });
    }

    res.json(policy);
  } catch (err) {
    console.error("getPublicPolicyByType error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Admin APIs ──────────────────────────────────────────────────────────────

/** POST /api/admin/policies — Create policy (Super Admin) */
export const createPolicy = async (req, res) => {
  try {
    const { title, type, content, status } = req.body;

    if (!title || !type || !content || !status) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const validTypes = [
      "refund_policy",
      "return_policy",
      "replacement_policy",
      "terms_of_use",
      "shipping_policy",
      "seller_agreement",
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid policy type" });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Check uniqueness
    const existing = await Policy.findOne({ type });
    if (existing) {
      return res.status(400).json({ message: "A policy of this type already exists" });
    }

    const sanitizedContent = sanitizePolicyContent(content);

    const policy = await Policy.create({
      title: title.trim(),
      type,
      content: sanitizedContent,
      status,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json(policy);
  } catch (err) {
    console.error("createPolicy error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** GET /api/admin/policies — Get all policies (Super Admin, paginated/filtered) */
export const getAllPolicies = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const type = req.query.type;
    const status = req.query.status;

    const filter = {};
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ title: regex }, { content: regex }];
    }
    if (type) {
      filter.type = type;
    }
    if (status && ["active", "inactive"].includes(status)) {
      filter.status = status;
    }

    const [policies, total] = await Promise.all([
      Policy.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name firstName lastName")
        .populate("updatedBy", "name firstName lastName"),
      Policy.countDocuments(filter),
    ]);

    res.json({
      policies,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("getAllPolicies error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** GET /api/admin/policies/:id — Get single policy by ID (Super Admin) */
export const getSinglePolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate("createdBy", "name firstName lastName")
      .populate("updatedBy", "name firstName lastName");
    
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }
    res.json(policy);
  } catch (err) {
    console.error("getSinglePolicy error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** PUT /api/admin/policies/:id — Update policy (Super Admin) */
export const updatePolicy = async (req, res) => {
  try {
    const { title, type, content, status } = req.body;

    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    if (type && type !== policy.type) {
      const validTypes = [
        "refund_policy",
        "return_policy",
        "replacement_policy",
        "terms_of_use",
        "shipping_policy",
        "seller_agreement",
      ];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid policy type" });
      }
      // Check uniqueness if changing type
      const existing = await Policy.findOne({ type });
      if (existing) {
        return res.status(400).json({ message: "A policy of this type already exists" });
      }
      policy.type = type;
    }

    if (title !== undefined) policy.title = title.trim();
    if (content !== undefined) policy.content = sanitizePolicyContent(content);
    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      policy.status = status;
    }

    policy.updatedBy = req.user._id;
    await policy.save();

    res.json(policy);
  } catch (err) {
    console.error("updatePolicy error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** DELETE /api/admin/policies/:id — Delete policy (Super Admin) */
export const deletePolicy = async (req, res) => {
  try {
    const policy = await Policy.findByIdAndDelete(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }
    res.json({ message: "Policy deleted successfully" });
  } catch (err) {
    console.error("deletePolicy error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** PATCH /api/admin/policies/:id/status — Change Status (Super Admin) */
export const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'active' or 'inactive'" });
    }

    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    policy.status = status;
    policy.updatedBy = req.user._id;
    await policy.save();

    res.json(policy);
  } catch (err) {
    console.error("changeStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
