import User from "../models/User.js"
import bcrypt from "bcrypt"

// ADD MEMBER (owner only)
export const addMember = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" })
    }

    // 🔥 RBAC (extra safety even if route already checks)
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owner can add members" })
    }

    // 🔥 Restrict roles
    const allowedRoles = ["admin", "editor"]
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" })
    }

    // 🔥 Check user inside SAME tenant only
    const existingUser = await User.findOne({
      email,
      tenantId: req.user.tenantId
    })

    if (existingUser) {
      return res.status(400).json({ message: "User already exists in this tenant" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      tenantId: req.user.tenantId,
      role
    })

    // 🔥 Remove sensitive data
    const userSafe = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    }

    res.status(201).json({
      message: "Member added successfully",
      user: userSafe
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}