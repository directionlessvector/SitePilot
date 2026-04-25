import express from "express"
import protect from "../middleware/authMiddleware.js"
import { createPage } from "../controllers/pageController.js"

const router = express.Router()

router.post("/", protect, createPage)

export default router