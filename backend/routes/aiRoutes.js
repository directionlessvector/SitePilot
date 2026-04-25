import express from "express"
import protect from "../middleware/authMiddleware.js"
import { generatePageContent } from "../controllers/aiController.js"
console.log(process.env.OPENAI_API_KEY)

const router = express.Router()

router.post("/generate", protect, generatePageContent)

export default router