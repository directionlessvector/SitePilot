import rateLimit from "express-rate-limit";

// Auth limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 20,

  message: {
    message:
      "Too many auth requests. Try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// AI limiter
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,

  max: 10,

  message: {
    message:
      "AI request limit exceeded. Try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// Public API limiter
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 100,

  message: {
    message:
      "Too many requests. Try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});