import express from "express"
import { getPublicWebsite } from "../controllers/publicController.js"
import { publicLimiter } from "../middleware/rateLimit.js";
const router = express.Router()
router.use(publicLimiter);
router.get("/:tenantSlug/:websiteSlug", getPublicWebsite)

export default router