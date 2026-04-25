import User from "../models/User.js"
import Tenant from "../models/Tenant.js"
import bcrypt from "bcrypt"
import generateToken from "../utils/generateToken.js"

// helper to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
}

// REGISTER
export const register = async (req, res) => {
  try {
    const { name, email, password, tenantName } = req.body

    // basic validation
    if (!name || !email || !password || !tenantName) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // generate slug
    const slug = generateSlug(tenantName)

    // check if tenant slug already exists (optional but good)
    const existingTenant = await Tenant.findOne({ slug })
    if (existingTenant) {
      return res.status(400).json({ message: "Tenant already exists with this name" })
    }

    // create tenant
    const tenant = await Tenant.create({
      name: tenantName,
      slug
    })

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // create user
   const user = await User.create({
  name,
  email,
  passwordHash: hashedPassword, // ✅ FIXED
  tenantId: tenant._id,
  role: "owner"
})

    // generate token
    const token = generateToken(user)

    res.status(201).json({
      message: "User registered successfully",
      token,
      user
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" })
    }

    // find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // compare password
const isMatch = await bcrypt.compare(password, user.passwordHash) // ✅ FIXED    
if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // generate token
    const token = generateToken(user)

    res.json({
      message: "Login successful",
      token,
      user
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}