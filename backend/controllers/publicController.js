import Tenant from "../models/Tenant.js"
import Website from "../models/Website.js"
import Page from "../models/Page.js"

export const getPublicWebsite = async (req, res) => {
  try {
    const { tenantSlug, websiteSlug } = req.params

    // Find tenant
    const tenant = await Tenant.findOne({
      slug: tenantSlug
    })

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found"
      })
    }

    // Find published website
    const website = await Website.findOne({
      tenantId: tenant._id,
      slug: websiteSlug,
      status: "published"
    })

    if (!website) {
      return res.status(404).json({
        message: "Website not found"
      })
    }

    // Find homepage
    const homepage = await Page.findOne({
      tenantId: tenant._id,
      websiteId: website._id,
      isHomepage: true
    })

    if (!homepage) {
      return res.status(404).json({
        message: "Homepage not found"
      })
    }

    // Return ONLY live content
    res.json({
      tenant: {
        name: tenant.name,
        slug: tenant.slug
      },

      website: {
        name: website.name,
        slug: website.slug,
        status: website.status
      },

      homepage: {
        title: homepage.title,
        liveContent: homepage.liveContent
      }
    })

  } catch (error) {
    console.error("Public website error:", error)

    res.status(500).json({
      message: "Server error"
    })
  }
}