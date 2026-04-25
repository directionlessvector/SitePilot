import Page from "../models/Page.js"

// helper to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
}

// CREATE PAGE
export const createPage = async (req, res) => {
  try {
    const { title, websiteId, isHomepage } = req.body

    if (!title || !websiteId) {
      return res.status(400).json({ message: "Title and websiteId required" })
    }

    const slug = generateSlug(title)

    // check duplicate slug inside same website
    const existing = await Page.findOne({
      websiteId,
      slug
    })

    if (existing) {
      return res.status(400).json({ message: "Page already exists with this title" })
    }

    // if homepage → unset previous homepage
    if (isHomepage) {
      await Page.updateMany(
        { websiteId },
        { isHomepage: false }
      )
    }

    const page = await Page.create({
      title,
      slug,
      websiteId,
      tenantId: req.user.tenantId,
      draftContent: [],
      liveContent: [],
      isHomepage: isHomepage || false
    })

    res.status(201).json({
      message: "Page created successfully",
      page
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}