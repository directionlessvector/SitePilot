/**
 * aiService.js
 * Handles all communication with the OpenAI API.
 * Includes retry logic, JSON validation, and fallback templates.
 * This is the ONLY place in the codebase that calls the AI API.
 */

import OpenAI from "openai";
import {
  safeJSONParse,
  validateAIResponse,
  getFallbackTemplate,
} from "../utils/aiHelpers.js";

// ─── Model (changed from Claude → OpenAI) ───────────────────────────────────
const MODEL = "gpt-5.4-mini";
const MAX_TOKENS = 1500;

// ─── Lazy client init (ONLY CHANGE: env + client) ───────────────────────────
let _client = null;
const getClient = () => {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
};

// ─── System prompt (UNCHANGED EXACTLY) ──────────────────────────────────────
const SYSTEM_PROMPT = `You are SitePilot's AI website generator. Your job is to generate website content as a strict JSON object.

ABSOLUTE RULES:
1. Return ONLY valid JSON — no markdown, no explanation, no code fences, no preamble
2. Always include these section types: hero, features, about, cta, footer
3. Generate 5 to 7 total sections minimum
4. Never use placeholder text like "Lorem ipsum" — write real, specific, compelling copy
5. Tailor ALL content to the specific business name, type, and tone provided
6. Use emoji for icons in features/services sections
7. bgColor must be a valid hex color that suits the business personality

Section schema — each section must have:
{ "type": string, "id": string, "props": object }

Available types and required props:
- hero: { headline, subtext, ctaText, ctaLink, bgColor, textColor }
- features: { title, items: [{ icon, title, desc }] } — exactly 3 items
- about: { title, body, imageAlt }
- cta: { headline, subtext, buttonText, buttonLink }
- footer: { companyName, tagline, links: [{ label, href }] }
- text_block: { title, body }
- contact_form: { title, fields: [{ label, type, required }], submitLabel }
- testimonials: { title, items: [{ quote, author, role }] }
- services: { title, items: [{ icon, title, desc, price }] }
- faq: { title, items: [{ question, answer }] }

Return format:
{
  "sections": [
    { "type": "hero", "id": "s1", "props": { ... } },
    ...
  ]
}`;

/**
 * callOpenAI (ONLY CHANGED FUNCTION)
 */
const callOpenAI = async (userPrompt, strictMode = false) => {
  const client = getClient();

  const prompt = strictMode
    ? userPrompt +
      "\n\nCRITICAL: Your previous response was not valid JSON. Return ONLY the raw JSON object. No text before or after."
    : userPrompt;

  const response = await client.responses.create({
    model: MODEL,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ],
    max_output_tokens: MAX_TOKENS,
  });

  // 🔥 ONLY CHANGE: OpenAI response extraction
  const text =
    response.output_text ||
    response.output?.[0]?.content?.[0]?.text ||
    "";

  if (!text) throw new Error("Empty response from OpenAI API");
  return text;
};

/**
 * generatePageSections (UNCHANGED)
 */
export const generatePageSections = async (userPrompt, businessName = "Your Business") => {
  let lastErrors = [];

  try {
    console.log("[AI] Attempt 1: Calling OpenAI...");
    const text = await callOpenAI(userPrompt, false);
    console.log("[AI] Raw response length:", text.length);

    const { success, data, error } = safeJSONParse(text);
    if (!success) {
      console.warn("[AI] Attempt 1 parse failed:", error);
      lastErrors.push(error);
      throw new Error("parse_failed");
    }

    const { valid, sections, errors } = validateAIResponse(data);
    if (!valid) {
      console.warn("[AI] Attempt 1 validation failed:", errors);
      lastErrors.push(...errors);
      throw new Error("validation_failed");
    }

    return { sections, usedFallback: false, errors: [] };
  } catch (err) {
    if (err.message !== "parse_failed" && err.message !== "validation_failed") {
      console.error("[AI] Attempt 1 API error:", err.message);
      lastErrors.push(err.message);
    }
  }

  try {
    console.log("[AI] Attempt 2: Retrying with strict prompt...");
    const text = await callOpenAI(userPrompt, true);

    const { success, data, error } = safeJSONParse(text);
    if (!success) {
      lastErrors.push(error);
      throw new Error("parse_failed");
    }

    const { valid, sections, errors } = validateAIResponse(data);
    if (!valid) {
      lastErrors.push(...errors);
      throw new Error("validation_failed");
    }

    return { sections, usedFallback: false, errors: [] };
  } catch (err) {
    if (err.message !== "parse_failed" && err.message !== "validation_failed") {
      console.error("[AI] Attempt 2 API error:", err.message);
      lastErrors.push(err.message);
    }
  }

  console.warn("[AI] Both attempts failed — using fallback template");
  const fallback = getFallbackTemplate(businessName);

  return {
    sections: fallback.sections,
    usedFallback: true,
    errors: lastErrors,
  };
};

/**
 * regenerateSingleSection (UNCHANGED except API call)
 */
export const regenerateSingleSection = async (userPrompt, sectionType) => {
  try {
    console.log(`[AI] Regenerating section: ${sectionType}`);
    const text = await callOpenAI(userPrompt, false);

    const { success, data } = safeJSONParse(text);
    if (!success) throw new Error("parse_failed");

    const raw = data.sections?.[0] || data;
    const { valid, sections } = validateAIResponse({ sections: [raw] });

    if (!valid || !sections.length) throw new Error("validation_failed");

    return { section: sections[0], usedFallback: false };
  } catch (err) {
    console.warn(`[AI] Section regen failed for ${sectionType}:`, err.message);

    const fallback = getFallbackTemplate();
    const fallbackSection =
      fallback.sections.find((s) => s.type === sectionType) || {
        type: sectionType,
        id: `s_${Date.now()}`,
        props: {},
      };

    return { section: fallbackSection, usedFallback: true };
  }
};