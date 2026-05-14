/**
 * planService.js
 * Enforces tenant plan limits for websites, pages, and AI calls.
 * All limit checks go through here — never inline in controllers.
 */
console.log("🔥 PLAN SERVICE LOADED");
import Tenant from "../models/Tenant.js";
import Website from "../models/Website.js";
import Page from "../models/Page.js";

// ─── Plan definitions (matches PRD Section 2.8) ──────────────────────────────
export const PLAN_LIMITS = {
  free: { websites: 1, pages: 3, aiCalls: 5, storage: 100 },
  pro: { websites: 5, pages: 20, aiCalls: 50, storage: 2048 },
  business: { websites: 999, pages: 999, aiCalls: 999, storage: 20480 },
};

/**
 * getPlanLimits
 * Returns plan limit object for a given plan name.
 */
export const getPlanLimits = (plan) => PLAN_LIMITS[plan] || PLAN_LIMITS.free;

/**
 * checkWebsiteLimit
 * Throws 402-style error if tenant has hit their website cap.
 *
 * @param {string} tenantId
 * @param {string} plan
 */
export const checkWebsiteLimit = async (tenantId, plan) => {
  const limits = getPlanLimits(plan);
  const count = await Website.countDocuments({ tenantId, status: { $ne: "deleted" } });

  if (count >= limits.websites) {
    const error = new Error(
      `You've reached the website limit for your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan (${limits.websites} website${limits.websites !== 1 ? "s" : ""}). Upgrade your plan to create more.`
    );
    error.statusCode = 402;
    error.code = "WEBSITE_LIMIT_REACHED";
    throw error;
  }
};

/**
 * checkPageLimit
 * Throws 402-style error if website has hit the page cap for the tenant's plan.
 *
 * @param {string} tenantId
 * @param {string} websiteId
 * @param {string} plan
 */
export const checkPageLimit = async (tenantId, websiteId, plan) => {
  const limits = getPlanLimits(plan);
  const count = await Page.countDocuments({ tenantId, websiteId });

  if (count >= limits.pages) {
    const error = new Error(
      `You've reached the page limit for your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan (${limits.pages} page${limits.pages !== 1 ? "s" : ""} per site). Upgrade your plan to add more pages.`
    );
    error.statusCode = 402;
    error.code = "PAGE_LIMIT_REACHED";
    throw error;
  }
};

/**
 * checkAICallLimit
 * Throws 402-style error if tenant has hit their monthly AI call quota.
 *
 * @param {object} tenant - Mongoose Tenant document (already fetched)
 */
export const checkAICallLimit = (tenant) => {
  const limits = getPlanLimits(tenant.plan);
  const used = tenant.usage?.aiCallsUsed ?? 0;

  if (used >= limits.aiCalls) {
    const error = new Error(
      `You've used all ${limits.aiCalls} AI generation${limits.aiCalls !== 1 ? "s" : ""} for your ${tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)} plan this month. Upgrade to get more.`
    );
    error.statusCode = 402;
    error.code = "AI_LIMIT_REACHED";
    throw error;
  }
};

/**
 * incrementAIUsage
 * Atomically increments aiCallsUsed on the tenant document.
 * Uses $inc to avoid race conditions.
 *
 * @param {string} tenantId
 * @returns {Promise<object>} Updated tenant
 */
console.log("🔥 UPDATED incrementAIUsage RUNNING");
export const incrementAIUsage = async (tenantId) => {
  return await Tenant.findByIdAndUpdate(
    tenantId,
    {
      $inc: { "usage.aiCallsUsed": 1 }
    },
    {
      new: true, // return updated doc
      runValidators: false
    }
  );
};
/**
 * getUsageSummary
 * Returns current usage vs limits for a tenant.
 *
 * @param {object} tenant - Mongoose Tenant document
 * @param {string} tenantId
 * @returns {Promise<object>}
 */
export const getUsageSummary = async (tenant, tenantId) => {
  const limits = getPlanLimits(tenant.plan);
  const [websiteCount, pageCount] = await Promise.all([
    Website.countDocuments({ tenantId, status: { $ne: "deleted" } }),
    Page.countDocuments({ tenantId }),
  ]);

  return {
    plan: tenant.plan,
    limits,
    usage: {
      websites: { used: websiteCount, limit: limits.websites },
      pages: { used: pageCount, limit: limits.pages },
      aiCalls: {
        used: tenant.usage?.aiCallsUsed ?? 0,
        limit: limits.aiCalls,
      },
      storage: {
        used: tenant.usage?.storageUsed ?? 0,
        limit: limits.storage,
        unit: "MB",
      },
    },
  };
};