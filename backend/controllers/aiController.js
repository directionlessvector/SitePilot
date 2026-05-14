console.log("🔥🔥🔥 NEW AI CONTROLLER LOADED 🔥🔥🔥");
import Tenant from "../models/Tenant.js";
import Page from "../models/Page.js";
import { v4 as uuidv4 } from "uuid";

import {
  generatePageSections,
  regenerateSingleSection
} from "../services/aiService.js";

import {
  checkAICallLimit,
  incrementAIUsage
} from "../services/planService.js";

import {
  buildAIPrompt,
  buildRegeneratePrompt,
  validateAIResponse
} from "../utils/aiHelpers.js";

// ─────────────────────────────────────────
// Allowed roles
// ─────────────────────────────────────────
const AI_ALLOWED_ROLES = new Set(["owner", "admin", "editor"]);

// ─────────────────────────────────────────
// Access control
// ─────────────────────────────────────────
const checkAIAccess = async (req, res) => {
  if (!AI_ALLOWED_ROLES.has(req.user.role)) {
    res.status(403).json({
      message: "Access denied",
      code: "FORBIDDEN"
    });
    return null;
  }

  const tenant = await Tenant.findOne({ _id: req.user.tenantId });

  if (!tenant) {
    res.status(404).json({
      message: "Tenant not found",
      code: "TENANT_NOT_FOUND"
    });
    return null;
  }

  try {
    checkAICallLimit(tenant);
  } catch (err) {
    res.status(err.statusCode || 402).json({
      message: err.message,
      code: err.code || "AI_LIMIT_REACHED",
      upgrade: true
    });
    return null;
  }

  return tenant;
};

// ─────────────────────────────────────────
// GENERATE PAGE CONTENT
// ─────────────────────────────────────────
export const generatePageContent = async (req, res) => {
  try {
    const { pageId, businessName, businessType, description, tone } = req.body;

    if (!pageId || !businessName || !businessType) {
      return res.status(400).json({
        message: "Missing required fields",
        code: "MISSING_FIELDS"
      });
    }

    const tenant = await checkAIAccess(req, res);
    if (!tenant) return;

    const page = await Page.findOne({
      _id: pageId,
      tenantId: req.user.tenantId
    });

    if (!page) {
      return res.status(404).json({
        message: "Page not found",
        code: "PAGE_NOT_FOUND"
      });
    }

    const prompt = buildAIPrompt({
      businessName,
      businessType,
      description,
      tone: tone || "professional",
      pageType: page.isHomepage ? "homepage" : page.title
    });

    const { sections, usedFallback, errors } =
      await generatePageSections(prompt, businessName);

    const validation = validateAIResponse({ sections });

    if (!validation.valid) {
      return res.status(500).json({
        message: "Invalid AI response format",
        code: "INVALID_AI_RESPONSE"
      });
    }

    const safeSections = sections.map((sec) => ({
      ...sec,
      id: sec.id || uuidv4()
    }));

    page.draftContent = safeSections;
    await page.save();

    const updatedTenant = await incrementAIUsage(req.user.tenantId);

    const used = updatedTenant.usage?.aiCallsUsed || 0;
    const limit =
      updatedTenant.planLimits?.aiCalls ||
      { free: 5, pro: 50, business: 999 }[updatedTenant.plan] ||
      5;

    return res.json({
      message: "AI content generated successfully",
      draftContent: page.draftContent,
      sectionsCount: safeSections.length,
      usedFallback,
      aiUsage: {
        used,
        limit,
        remaining: Math.max(0, limit - used)
      },
      ...(errors?.length > 0 && { warnings: errors })
    });

  } catch (error) {
    console.error("AI generate error:", error);
    res.status(500).json({
      message: "Failed to generate content",
      code: "INTERNAL_ERROR"
    });
  }
};

// ─────────────────────────────────────────
// IMPROVE EXISTING CONTENT
// ─────────────────────────────────────────
export const improveExistingContent = async (req, res) => {
  try {
    const { pageId, instruction } = req.body;

    if (!pageId || !instruction) {
      return res.status(400).json({
        message: "Missing fields",
        code: "MISSING_FIELDS"
      });
    }

    const tenant = await checkAIAccess(req, res);
    if (!tenant) return;

    const page = await Page.findOne({
      _id: pageId,
      tenantId: req.user.tenantId
    });

    if (!page || !page.draftContent?.length) {
      return res.status(400).json({
        message: "No content to improve",
        code: "NO_CONTENT"
      });
    }

    const prompt = `
Improve this website JSON:

${JSON.stringify(page.draftContent)}

Instruction: ${instruction}

Return ONLY JSON in same format.
`;

    const { sections } = await generatePageSections(prompt, "");

    const validation = validateAIResponse({ sections });

    const finalSections =
      validation.valid && sections.length > 0
        ? sections.map(sec => ({ ...sec, id: sec.id || uuidv4() }))
        : page.draftContent;

    page.draftContent = finalSections;
    await page.save();

    await incrementAIUsage(req.user.tenantId);

    res.json({
      message: "Content improved",
      draftContent: page.draftContent
    });

  } catch (error) {
    console.error("Improve error:", error);
    res.status(500).json({
      message: "Failed to improve content"
    });
  }
};

// ─────────────────────────────────────────
// REGENERATE SINGLE SECTION
// ─────────────────────────────────────────
export const regenerateSection = async (req, res) => {
  try {
    const { pageId, sectionId, instruction, businessContext } = req.body;

    if (!pageId || !sectionId) {
      return res.status(400).json({
        message: "Missing fields",
        code: "MISSING_FIELDS"
      });
    }

    const tenant = await checkAIAccess(req, res);
    if (!tenant) return;

    const page = await Page.findOne({
      _id: pageId,
      tenantId: req.user.tenantId
    });

    if (!page) {
      return res.status(404).json({
        message: "Page not found",
        code: "PAGE_NOT_FOUND"
      });
    }

    const index = page.draftContent.findIndex(
      (s) => s.id === sectionId
    );

    if (index === -1) {
      return res.status(404).json({
        message: "Section not found",
        code: "SECTION_NOT_FOUND"
      });
    }

    const current = page.draftContent[index];

    const prompt = buildRegeneratePrompt({
      sectionType: current.type,
      currentProps: current.props,
      businessContext: businessContext || "business website",
      instruction: instruction || "improve this section"
    });

    const { section } = await regenerateSingleSection(
      prompt,
      current.type
    );

    const newSection = {
      ...section,
      id: sectionId
    };

    page.draftContent[index] = newSection;
    await page.save();

    await incrementAIUsage(req.user.tenantId);

    res.json({
      message: "Section regenerated",
      section: newSection,
      draftContent: page.draftContent
    });

  } catch (error) {
    console.error("Regenerate error:", error);
    res.status(500).json({
      message: "Failed to regenerate section"
    });
  }
};