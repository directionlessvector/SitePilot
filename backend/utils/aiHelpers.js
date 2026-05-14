/**
 * aiHelpers.js
 * Utility functions for AI response handling, validation, and prompt construction.
 * Never trust raw AI output — always validate before saving.
 */

// ─── Allowed section types (matches PRD spec) ───────────────────────────────
const ALLOWED_SECTION_TYPES = new Set([
  "hero",
  "features",
  "about",
  "cta",
  "footer",
  "text_block",
  "contact_form",
  "testimonials",
  "pricing",
  "gallery",
  "services",
  "faq",
]);

// ─── Required props per section type ────────────────────────────────────────
const REQUIRED_PROPS = {
  hero: ["headline", "subtext", "ctaText"],
  features: ["title", "items"],
  about: ["title", "body"],
  cta: ["headline", "buttonText"],
  footer: ["companyName", "links"],
  text_block: ["title", "body"],
  contact_form: ["title", "fields"],
  testimonials: ["title", "items"],
  pricing: ["title", "plans"],
  gallery: ["title", "images"],
  services: ["title", "items"],
  faq: ["title", "items"],
};

// ─── Default fallback props per section type ─────────────────────────────────
const DEFAULT_PROPS = {
  hero: {
    headline: "Welcome",
    subtext: "Discover what we have to offer.",
    ctaText: "Get Started",
    ctaLink: "/contact",
    bgColor: "#0f172a",
    textColor: "#ffffff",
  },
  features: {
    title: "Our Features",
    items: [
      { icon: "⚡", title: "Fast", desc: "Lightning fast performance." },
      { icon: "🔒", title: "Secure", desc: "Enterprise-grade security." },
      { icon: "🎯", title: "Reliable", desc: "99.9% uptime guaranteed." },
    ],
  },
  about: {
    title: "About Us",
    body: "We are dedicated to delivering exceptional value.",
    imageAlt: "About our team",
  },
  cta: {
    headline: "Ready to get started?",
    subtext: "Join thousands of happy customers.",
    buttonText: "Contact Us",
    buttonLink: "/contact",
  },
  footer: {
    companyName: "Company",
    tagline: "Building the future.",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
};

/**
 * safeJSONParse
 * Safely parses AI text response to JSON.
 * Strips markdown code fences if present before parsing.
 *
 * @param {string} text - Raw text from AI response
 * @returns {{ success: boolean, data: object|null, error: string|null }}
 */
export const safeJSONParse = (text) => {
  if (!text || typeof text !== "string") {
    return { success: false, data: null, error: "Empty or non-string input" };
  }

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  let cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Some models wrap in extra text — try to extract first JSON object/array
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
  }

  try {
    const data = JSON.parse(cleaned);
    return { success: true, data, error: null };
  } catch (err) {
    return { success: false, data: null, error: `JSON parse failed: ${err.message}` };
  }
};

/**
 * validateAIResponse
 * Validates the structure of AI-generated JSON.
 * Ensures sections array exists, each section has required fields,
 * and fills missing props with safe defaults.
 *
 * @param {object} json - Parsed JSON object from AI
 * @returns {{ valid: boolean, sections: Array, errors: string[] }}
 */
export const validateAIResponse = (json) => {
  const errors = [];

  // Must have sections array
  if (!json || typeof json !== "object") {
    return { valid: false, sections: [], errors: ["Response is not an object"] };
  }

  if (!Array.isArray(json.sections)) {
    return { valid: false, sections: [], errors: ["Missing 'sections' array"] };
  }

  if (json.sections.length < 3) {
    errors.push(`Only ${json.sections.length} sections — expected at least 3`);
  }

  const validatedSections = json.sections
    .filter((section, i) => {
      if (!section || typeof section !== "object") {
        errors.push(`Section ${i} is not an object`);
        return false;
      }
      if (!section.type) {
        errors.push(`Section ${i} missing 'type'`);
        return false;
      }
      if (!ALLOWED_SECTION_TYPES.has(section.type)) {
        errors.push(`Section ${i} has unknown type: '${section.type}'`);
        return false;
      }
      return true;
    })
    .map((section, i) => {
      // Ensure unique id
      const id = section.id || `s${i + 1}_${Date.now()}`;

      // Merge with defaults — AI props take priority, defaults fill gaps
      const defaults = DEFAULT_PROPS[section.type] || {};
      const props = { ...defaults, ...(section.props || {}) };

      // Fill individual missing required props with defaults
      const required = REQUIRED_PROPS[section.type] || [];
      required.forEach((key) => {
        if (props[key] === undefined || props[key] === null || props[key] === "") {
          props[key] = defaults[key] ?? "";
        }
      });

      return { type: section.type, id, props, style: section.style || {} };
    });

  const valid = validatedSections.length >= 3;
  return { valid, sections: validatedSections, errors };
};

/**
 * buildAIPrompt
 * Constructs the user-facing prompt from business inputs.
 * Kept concise to stay within token budget.
 *
 * @param {{ businessName, businessType, description, tone, pageType }} input
 * @returns {string}
 */
export const buildAIPrompt = ({
  businessName,
  businessType,
  description = "",
  tone = "professional",
  pageType = "homepage",
}) => {
  return `Generate a complete ${pageType} for:

Business Name: ${businessName}
Business Type: ${businessType}
Description: ${description || "A modern " + businessType + " business."}
Tone: ${tone} (professional | friendly | bold | minimal)

Requirements:
- Generate 5 to 7 sections minimum
- Tailor ALL content specifically to "${businessName}" — no generic placeholders
- Use real, compelling copy that reflects the business type and tone
- Hero section must have a punchy headline (max 8 words) and a clear value proposition
- Features/Services section must have exactly 3 items with relevant icons (use emoji)
- Include testimonials or social proof if suitable for this business type
- Footer must have real navigation links
- All colors should match the business personality (bgColor as hex)

Return ONLY valid JSON in this exact shape:
{
  "sections": [
    {
      "type": "hero",
      "id": "s1",
      "props": {
        "headline": "string",
        "subtext": "string",
        "ctaText": "string",
        "ctaLink": "/contact",
        "bgColor": "#hex",
        "textColor": "#hex"
      }
    }
  ]
}`;
};

/**
 * buildRegeneratePrompt
 * Constructs a prompt for regenerating a single section.
 *
 * @param {{ sectionType, currentProps, businessContext, instruction }} input
 * @returns {string}
 */
export const buildRegeneratePrompt = ({
  sectionType,
  currentProps,
  businessContext,
  instruction = "Improve this section",
}) => {
  return `Regenerate only the "${sectionType}" section for this business:

Business Context: ${businessContext}
Current props: ${JSON.stringify(currentProps, null, 2)}
Instruction: ${instruction}

Return ONLY valid JSON for a single section:
{
  "type": "${sectionType}",
  "id": "s_regen",
  "props": { ... }
}`;
};

/**
 * Hardcoded 5-section fallback template.
 * Used when AI fails twice — ensures the product never breaks.
 */
export const getFallbackTemplate = (businessName = "Your Business") => ({
  sections: [
    {
      type: "hero",
      id: "s1",
      props: {
        headline: `Welcome to ${businessName}`,
        subtext: "We deliver exceptional quality and service you can trust.",
        ctaText: "Get Started",
        ctaLink: "/contact",
        bgColor: "#0f172a",
        textColor: "#ffffff",
      },
    },
    {
      type: "features",
      id: "s2",
      props: {
        title: "Why Choose Us",
        items: [
          { icon: "⚡", title: "Fast Delivery", desc: "Quick turnaround on every project." },
          { icon: "🔒", title: "Trusted & Secure", desc: "Your data and privacy protected." },
          { icon: "🎯", title: "Results Focused", desc: "We measure success by your outcomes." },
        ],
      },
    },
    {
      type: "about",
      id: "s3",
      props: {
        title: `About ${businessName}`,
        body: "We are a dedicated team committed to delivering exceptional value. Our focus is on quality, reliability, and building long-term relationships with our clients.",
        imageAlt: "Our team at work",
      },
    },
    {
      type: "cta",
      id: "s4",
      props: {
        headline: "Ready to work together?",
        subtext: "Get in touch today and let's discuss your needs.",
        buttonText: "Contact Us",
        buttonLink: "/contact",
      },
    },
    {
      type: "footer",
      id: "s5",
      props: {
        companyName: businessName,
        tagline: "Quality you can count on.",
        links: [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
        ],
      },
    },
  ],
});