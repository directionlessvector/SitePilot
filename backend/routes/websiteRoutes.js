import express from "express"
import protect from "../middleware/authMiddleware.js"
import authorizeRoles from "../middleware/roleMiddleware.js"

import {
  createWebsite,
  getWebsites,
  publishWebsite,
  getDeployments,
  deleteWebsite
} from "../controllers/websiteController.js";

const router = express.Router()

router.post(
  "/",
  protect,
  authorizeRoles("owner"),
  createWebsite
)

router.get(
  "/",
  protect,
  getWebsites
)
router.post(
  "/:id/publish",
  protect,
  authorizeRoles("owner", "admin"),
  publishWebsite
)
router.get(
  "/:id/deployments",
  protect,
  authorizeRoles("owner", "admin"),
  getDeployments
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("owner"),
  deleteWebsite
);
export default router