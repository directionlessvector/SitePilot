import OpenAI from "openai"
import Page from "../models/Page.js"

export const generatePageContent = async (req, res) => {
  try {
    const { pageId, prompt } = req.body

    if (!pageId || !prompt) {
      return res.status(400).json({ message: "pageId and prompt required" })
    }

    // 🔐 create client AFTER env is loaded
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // quick debug (remove later)
    // console.log("KEY:", process.env.OPENAI_API_KEY)

    const page = await Page.findById(pageId)
    if (!page) {
      return res.status(404).json({ message: "Page not found" })
    }

    const systemPrompt = `
You are a website builder AI.
Generate a JSON response for a webpage.

STRICT RULES:
- Return ONLY valid JSON
- No explanation
- No text outside JSON
- Format:

{
  "sections": [
    {
      "type": "hero",
      "props": {
        "title": "string",
        "subtitle": "string"
      }
    }
  ]
}
`

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_output_tokens: 800
    })

    // 🧠 safer text extraction
    const text =
      response.output_text ??
      response.output?.[0]?.content?.[0]?.text ??
      ""

    if (!text) {
      return res.status(500).json({ message: "Empty AI response" })
    }

    let json
    try {
      json = JSON.parse(text)
    } catch (err) {
      return res.status(500).json({
        message: "AI returned invalid JSON",
        raw: text
      })
    }

    page.draftContent = json.sections
    await page.save()

    res.json({
      message: "AI content generated",
      draftContent: page.draftContent
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}