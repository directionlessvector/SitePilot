import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  trackView,
  getAnalyticsSummary,
  getViewsByDay
} from "../controllers/analyticsController.js";

const router = express.Router();

router.post(
  "/view",
  protect,
  trackView
);

router.get(
  "/summary",
  protect,
  getAnalyticsSummary
);
router.get(
  "/views-by-day",
  protect,
  getViewsByDay
);

export default router;