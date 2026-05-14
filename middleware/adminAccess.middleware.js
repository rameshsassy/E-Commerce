export const VALID_ADMIN_SECTIONS = [
  "dashboard",
  "sellers",
  "kyc",
  "products",
  "orders",
  "returns",
  "coupons",
  "categories",
];

export const authorizeSuperAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Only the primary administrator can manage admin roles.",
    });
  }
  next();
};

export const authorizeAdminRole = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.role === "admin" || req.user.role === "admin_staff") return next();
  return res.status(403).json({ message: "Admin access required" });
};

export const requireAdminSection = (sectionKey) => (req, res, next) => {
  const u = req.user;
  if (!u) return res.status(401).json({ message: "Not authenticated" });
  if (u.role === "admin") return next();
  if (u.role !== "admin_staff") return res.status(403).json({ message: "Access denied" });
  const level = u.adminAccessLevel ?? "full";
  if (level === "full") return next();
  if (level === "limited") {
    const allowed = u.adminAllowedSections || [];
    if (allowed.includes(sectionKey)) return next();
    return res.status(403).json({ message: "You do not have access to this area." });
  }
  return res.status(403).json({ message: "Access denied" });
};

export const allowSellerOrAdminForReturns = (req, res, next) => {
  const u = req.user;
  if (!u) return res.status(401).json({ message: "Not authenticated" });
  if (u.role === "seller") return next();
  if (u.role === "admin") return next();
  if (u.role === "admin_staff") {
    const level = u.adminAccessLevel ?? "full";
    if (level === "full") return next();
    if ((u.adminAllowedSections || []).includes("returns")) return next();
  }
  return res.status(403).json({ message: "Access denied" });
};

export const allowSellerOrAdminForShipments = (req, res, next) => {
  const u = req.user;
  if (!u) return res.status(401).json({ message: "Not authenticated" });
  if (u.role === "seller") return next();
  if (u.role === "admin") return next();
  if (u.role === "admin_staff") {
    const level = u.adminAccessLevel ?? "full";
    if (level === "full") return next();
    if ((u.adminAllowedSections || []).includes("orders")) return next();
  }
  return res.status(403).json({ message: "Access denied" });
};
