// In-memory store for rate limiting
const signupAttempts = new Map();
const secretKeyAttempts = new Map();

/**
 * Middleware to protect admin signup from brute force and secret key guessing
 */
export const adminSignupRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  
  // 1. IP-based rate limiting (prevent brute force)
  // Max 10 signup attempts per 15 minutes per IP
  const WINDOW_MS = 15 * 60 * 1000;
  const MAX_SIGNUP_ATTEMPTS = 10;
  
  const ipAttempts = signupAttempts.get(ip) || [];
  // Filter attempts within the window
  const recentAttempts = ipAttempts.filter(timestamp => now - timestamp < WINDOW_MS);
  recentAttempts.push(now);
  signupAttempts.set(ip, recentAttempts);
  
  if (recentAttempts.length > MAX_SIGNUP_ATTEMPTS) {
    console.warn(`[Admin Signup Rate Limit] Brute-force block on IP: ${ip}`);
    return res.status(429).json({
      success: false,
      message: "Too many signup attempts. Please try again after 15 minutes."
    });
  }
  
  // 2. Secret key failed attempts limit
  // Max 5 failed secret key attempts per 15 minutes per IP
  const MAX_FAILED_SECRET_KEYS = 5;
  const failedKeys = secretKeyAttempts.get(ip) || [];
  const recentFailedKeys = failedKeys.filter(timestamp => now - timestamp < WINDOW_MS);
  
  if (recentFailedKeys.length >= MAX_FAILED_SECRET_KEYS) {
    console.warn(`[Admin Secret Key Rate Limit] Failed key block on IP: ${ip}`);
    return res.status(429).json({
      success: false,
      message: "Too many invalid secret key attempts. Please try again after 15 minutes."
    });
  }
  
  // Attach helper to record failed secret key attempt
  req.recordFailedSecretKeyAttempt = () => {
    const keyAttempts = secretKeyAttempts.get(ip) || [];
    const updatedAttempts = keyAttempts.filter(timestamp => Date.now() - timestamp < WINDOW_MS);
    updatedAttempts.push(Date.now());
    secretKeyAttempts.set(ip, updatedAttempts);
  };
  
  next();
};
