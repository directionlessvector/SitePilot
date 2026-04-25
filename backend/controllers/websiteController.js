import Website from "../models/Website.js"

// helper to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
}

// CREATE WEBSITE (owner only)
export const createWebsite = async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ message: "Website name required" })
    }

    const slug = generateSlug(name)

    // optional: prevent duplicate slug per tenant
    const existing = await Website.findOne({
      tenantId: req.user.tenantId,
      slug
    })

    if (existing) {
      return res.status(400).json({ message: "Website with this name already exists" })
    }

    const website = await Website.create({
      name,
      slug, // ✅ FIX
      tenantId: req.user.tenantId
    })

    res.status(201).json({
      message: "Website created successfully",
      website
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
export const getWebsites = async (req, res) => {
  try {
    const websites = await Website.find({
      tenantId: req.user.tenantId
    })

    res.json(websites)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}