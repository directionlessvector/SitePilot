import Page from "../models/Page.js"
import Website from "../models/Website.js"
import Tenant from "../models/Tenant.js"
import { checkPageLimit } from "../services/planService.js"

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

    // 🔥 1) VERIFY WEBSITE BELONGS TO TENANT
    const website = await Website.findOne({
      _id: websiteId,
      tenantId: req.user.tenantId
    })

    if (!website) {
      return res.status(404).json({ message: "Website not found" })
    }

    // 🔥 2) PLAN LIMIT CHECK
    const tenant = await Tenant.findById(req.user.tenantId)
    await checkPageLimit(req.user.tenantId, websiteId, tenant.plan)

    const slug = generateSlug(title)

    // 🔥 3) DUPLICATE CHECK WITH TENANT ISOLATION
    const existing = await Page.findOne({
      websiteId,
      tenantId: req.user.tenantId,
      slug
    })

    if (existing) {
      return res.status(400).json({ message: "Page already exists with this title" })
    }

    // 🔥 4) HOMEPAGE UPDATE (SCOPED)
    if (isHomepage) {
      await Page.updateMany(
        { websiteId, tenantId: req.user.tenantId },
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
export const updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, draftContent } = req.body;

    const page = await Page.findOne({
      _id: id,
      tenantId: req.user.tenantId,
    });

    if (!page) {
      return res.status(404).json({
        message: "Page not found",
      });
    }

    if (title) {
      page.title = title;
    }

    if (draftContent) {
      if (!Array.isArray(draftContent)) {
        return res.status(400).json({
          message: "draftContent must be an array",
        });
      }

      page.draftContent = draftContent;
    }

    await page.save();

    res.json({
      message: "Page updated successfully",
      page,
    });
  } catch (error) {
    console.error("Update page error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const getPages = async (req, res) => {
  try {
    const { websiteId } = req.params;

    const pages = await Page.find({
      websiteId,
      tenantId: req.user.tenantId,
    }).sort({ order: 1 });

    res.json({
      pages,
    });
  } catch (error) {
    console.error("Get pages error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const getPageById = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await Page.findOne({
      _id: id,
      tenantId: req.user.tenantId,
    });

    if (!page) {
      return res.status(404).json({
        message: "Page not found",
      });
    }

    res.json({
      page,
    });
  } catch (error) {
    console.error("Get page error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const deletePage = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await Page.findOne({
      _id: id,
      tenantId: req.user.tenantId,
    });

    if (!page) {
      return res.status(404).json({
        message: "Page not found",
      });
    }

    // Prevent homepage deletion
    if (page.isHomepage) {
      return res.status(400).json({
        message: "Homepage cannot be deleted",
      });
    }

    await Page.deleteOne({
      _id: id,
      tenantId: req.user.tenantId,
    });

    res.json({
      message: "Page deleted successfully",
    });
  } catch (error) {
    console.error("Delete page error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};