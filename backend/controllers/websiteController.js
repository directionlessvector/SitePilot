import Website from "../models/Website.js"
import Tenant from "../models/Tenant.js"
import { checkWebsiteLimit } from "../services/planService.js"
import Deployment from "../models/Deployment.js"
import Page from "../models/Page.js"

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

    // 🔥 get tenant for plan check
    const tenant = await Tenant.findById(req.user.tenantId)

    // 🔥 enforce plan limit
    await checkWebsiteLimit(req.user.tenantId, tenant.plan)

    const existing = await Website.findOne({
      tenantId: req.user.tenantId,
      slug
    })

    if (existing) {
      return res.status(400).json({ message: "Website with this name already exists" })
    }

    const website = await Website.create({
      name,
      slug,
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

// GET WEBSITES
export const getWebsites = async (req, res) => {
  try {
const websites = await Website.find({
  tenantId: req.user.tenantId,
  status: { $ne: "deleted" }
}).sort({ createdAt: -1 })

    res.json(websites)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
export const publishWebsite = async (req, res) => {
  try {
    const { id } = req.params

    // Find website belonging to tenant
    const website = await Website.findOne({
      _id: id,
      tenantId: req.user.tenantId
    })

    if (!website) {
      return res.status(404).json({
        message: "Website not found"
      })
    }

    // Fetch all pages
    const pages = await Page.find({
      websiteId: id,
      tenantId: req.user.tenantId
    })

    // Copy draft → live
    for (const page of pages) {
      page.liveContent = page.draftContent
      await page.save()
    }

    // Mark website published
    website.status = "published"
    website.publishedAt = new Date()

    await website.save()

    // Save deployment snapshot
    await Deployment.create({
      tenantId: req.user.tenantId,
      websiteId: website._id,
      publishedBy: req.user.userId,

      contentSnapshot: {
        website,
        pages
      }
    })

    res.json({
      message: "Website published successfully",
      publishedAt: website.publishedAt
    })

  } catch (error) {
    console.error("Publish website error:", error)

    res.status(500).json({
      message: "Server error"
    })
  }
}
export const getDeployments = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify website belongs to tenant
    const website = await Website.findOne({
      _id: id,
      tenantId: req.user.tenantId,
    });

    if (!website) {
      return res.status(404).json({
        message: "Website not found",
      });
    }

    const deployments = await Deployment.find({
      websiteId: id,
      tenantId: req.user.tenantId,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      deployments,
    });
  } catch (error) {
    console.error("Get deployments error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const deleteWebsite = async (req, res) => {
  try {
    const { id } = req.params;

    const website = await Website.findOne({
      _id: id,
      tenantId: req.user.tenantId,
    });

    if (!website) {
      return res.status(404).json({
        message: "Website not found",
      });
    }

    // Soft delete website
    website.status = "deleted";

    await website.save();

    // Soft delete pages
    await Page.updateMany(
      {
        websiteId: id,
        tenantId: req.user.tenantId,
      },
      {
        status: "deleted",
      }
    );

    res.json({
      message: "Website deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete website error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};