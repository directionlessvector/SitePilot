import express from "express";

import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

import {
  updatePlan,
} from "../controllers/tenantController.js";

const router = express.Router();

router.put(
  "/plan",
  protect,
  authorizeRoles("owner"),
  updatePlan
);

export default router;