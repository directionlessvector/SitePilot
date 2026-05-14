import Tenant from "../models/Tenant.js";

const ALLOWED_PLANS = [
  "free",
  "pro",
  "business",
];

export const updatePlan = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan) {
      return res.status(400).json({
        message: "Plan is required",
      });
    }

    if (!ALLOWED_PLANS.includes(plan)) {
      return res.status(400).json({
        message: "Invalid plan",
      });
    }

    const tenant = await Tenant.findById(
      req.user.tenantId
    );

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    tenant.plan = plan;

    await tenant.save();

    res.json({
      message: "Plan updated successfully",

      tenant: {
        id: tenant._id,
        name: tenant.name,
        plan: tenant.plan,
      },
    });
  } catch (error) {
    console.error(
      "Update plan error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};