import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // 15 minutes as per requirement
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET, // Alternatively, you could use a separate JWT_REFRESH_SECRET
    { expiresIn: "30d" } // 30 days as per requirement
  );
};

// Keeping this for backwards compatibility if needed elsewhere, 
// but auth flows will use the specific generators now.
const generateToken = (user) => {
  return generateAccessToken(user);
};

export default generateToken;