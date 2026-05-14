import mongoose from "mongoose";
import AnalyticsEvent from "../models/AnalyticsEvent.js";
import Website from "../models/Website.js";
import Page from "../models/Page.js";
import Tenant from "../models/Tenant.js";

export const trackView = async (req, res) => {
  try {
    const { websiteId, pageSlug } = req.body;

    if (!websiteId || !pageSlug) {
      return res.status(400).json({
        message: "websiteId and pageSlug are required",
      });
    }

    await AnalyticsEvent.create({
      tenantId: req.user.tenantId,
      websiteId,
      pageSlug,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      message: "View tracked",
    });
  } catch (error) {
    console.error("Track view error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getAnalyticsSummary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const tenant = await Tenant.findById(tenantId);

    const [
      totalViews,
      totalWebsites,
      totalPages,
    ] = await Promise.all([
      AnalyticsEvent.countDocuments({
        tenantId,
      }),

      Website.countDocuments({
        tenantId,
        status: { $ne: "deleted" },
      }),

      Page.countDocuments({
        tenantId,
      }),
    ]);

    res.json({
      analytics: {
        totalViews,
        totalWebsites,
        totalPages,

        aiUsage:
          tenant?.usage?.aiCallsUsed || 0,

        storageUsed:
          tenant?.usage?.storageUsed || 0,
      },
    });
  } catch (error) {
    console.error(
      "Analytics summary error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const getViewsByDay = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const views = await AnalyticsEvent.aggregate([
{
  $match: {
    tenantId: new mongoose.Types.ObjectId(
      req.user.tenantId
    ),
  },
},

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$viewedAt",
            },
          },

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    res.json({
      views,
    });
  } catch (error) {
    console.error(
      "Views by day error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};
