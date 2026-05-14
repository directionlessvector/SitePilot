import express from "express"
import protect from "../middleware/authMiddleware.js"
import authorizeRoles from "../middleware/roleMiddleware.js"

import {
  createWebsite,
  getWebsites
} from "../controllers/websiteController.js"

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

export default router