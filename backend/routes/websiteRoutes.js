import express from "express"
import authenticate from "../middleware/authMiddleware.js"
import authorize from "../middleware/authorize.js"
import { createWebsite, getWebsites } from "../controllers/websiteController.js"

const router = express.Router()

router.post("/", authenticate, authorize("owner"), createWebsite)
router.get("/", authenticate, getWebsites)

export default router