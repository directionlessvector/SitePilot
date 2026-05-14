/**
 * aiRoutes.js
 * All AI-related routes.
 * Every route is protected by authentication middleware.
 * Rate limiting applied to prevent abuse.
 *
 * Routes:
 *   POST /api/ai/generate            → Generate full page from business details
 *   POST /api/ai/improve             → Improve existing page content
 *   POST /api/ai/regenerate-section  → Regenerate a single section
 */

import express from "express";
import rateLimit from "express-rate-limit";
import protect from "../middleware/authMiddleware.js"
import {
  generatePageContent,
  improveExistingContent,
  regenerateSection,
} from "../controllers/aiController.js";
import { aiLimiter } from "../middleware/rateLimit.js";
const router = express.Router();
router.use(aiLimiter);

// ─── Rate limiter: max 20 AI requests per 15 minutes per IP ─────────────────
// This is a second line of defence — plan limits are enforced server-side too.
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many AI requests. Please wait a few minutes before trying again.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

// ─── Apply auth + rate limit to all AI routes ────────────────────────────────
router.use(protect);
router.use(aiRateLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/ai/generate
 * Generate full page content from business details.
 *
 * Body: {
 *   pageId: string (required)
 *   businessName: string (required)
 *   businessType: string (required)
 *   description?: string
 *   tone?: "professional" | "friendly" | "bold" | "minimal"
 * }
 */
router.post("/generate", generatePageContent);

/**
 * POST /api/ai/improve
 * Improve existing page content with a natural language instruction.
 *
 * Body: {
 *   pageId: string (required)
 *   instruction: string (required) e.g. "Make the tone more friendly"
 * }
 */
router.post("/improve", improveExistingContent);

/**
 * POST /api/ai/regenerate-section
 * Regenerate a single section in a page.
 *
 * Body: {
 *   pageId: string (required)
 *   sectionId: string (required)
 *   instruction?: string e.g. "Make this more persuasive"
 *   businessContext?: string e.g. "A bakery in Mumbai specializing in sourdough"
 * }
 */
router.post("/regenerate-section", regenerateSection);

export default router;