import User from "../models/User.js"
import bcrypt from "bcrypt"

// ADD MEMBER (owner only)
export const addMember = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" })
    }

    // only owner can add members
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owner can add members" })
    }

    // check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      tenantId: req.user.tenantId, // 🔥 SAME TENANT
      role // "admin" or "editor"
    })

    res.status(201).json({
      message: "Member added successfully",
      user
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}