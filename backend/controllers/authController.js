import User from "../models/User.js"
import Tenant from "../models/Tenant.js"
import bcrypt from "bcrypt"
import generateToken from "../middleware/utils/generateToken.js"

// REGISTER
export const register = async (req, res) => {
  try {
    const { name, email, password, tenantName } = req.body

    // check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // create tenant
    const tenant = await Tenant.create({
      name: tenantName
    })

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      tenantId: tenant._id,
      role: "owner"
    })

    // generate token
    const token = generateToken(user)

    res.status(201).json({
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

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = generateToken(user)

    res.json({
      token,
      user
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}