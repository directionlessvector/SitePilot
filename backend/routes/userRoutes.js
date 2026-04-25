import express from "express"
import protect from "../middleware/authMiddleware.js"
import authorizeRoles from "../middleware/roleMiddleware.js"
import { addMember } from "../controllers/userController.js"

const router = express.Router()

// only owner can add members
router.post("/", protect, authorizeRoles("owner"), addMember)

export default router