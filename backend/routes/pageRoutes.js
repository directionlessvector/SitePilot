import express from "express"
import protect from "../middleware/authMiddleware.js"
import authorizeRoles from "../middleware/roleMiddleware.js"
import { createPage } from "../controllers/pageController.js"

const router = express.Router()

router.post("/", protect, authorizeRoles("owner", "admin"), createPage)

export default router