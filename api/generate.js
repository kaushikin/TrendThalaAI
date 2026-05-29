module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "OpenAI key missing" });
    }

    const {
      topic = "",
      details = "",
      links = "",
      custom = "",
      mood = "Powerful",
      figure = "",
      style = "meme",
      imageBase64 = null,
      imageMime = null,
      memePageMode = false
    } = req.body || {};

    const clean = (value, max = 1500) => String(value || "").trim().slice(0, max);

    const safeTopic = clean(topic, 250);
    const safeDetails = clean(details, 2000);
    const safeCustom = clean(custom, 1000);
    const safeFigure = clean(figure, 120);

    if (!safeTopic && !safeDetails && !imageBase64) {
      return res.status(400).json({ success: false, error: "Please provide a topic, details, or image." });
    }

    let systemPrompt = `
You are Trend Thala AI — a viral meme page content creator for YouTube Shorts and Instagram.

Focus: Create highly shareable, funny, and SEO-optimized meme content.

${memePageMode ? `
**MEME PAGE MODE ACTIVATED**
- Focus only on image-based content
- Create a powerful Grok Image Prompt
- High SEO focus (searchable titles, captions, hashtags)
- No video or voiceover content
- Make it funny, relatable, and highly shareable
` : ''}

Output EXACTLY in this format:
PART 1: Meme Concept & Idea
PART 2: Grok Image Prompt (9:16 - Very Detailed for Grok)
PART 3: YouTube Shorts Title Options (SEO Optimized)
PART 4: Instagram Caption + Keywords
PART 5: Hashtag Strategy (YouTube + Instagram)
PART 6: Thumbnail Text Ideas
`;

    const userPrompt = `
Create meme page content for YouTube Shorts and Instagram.

Topic: ${safeTopic || "Not provided"}
Details: ${safeDetails || "Not provided"}
Custom Instructions: ${safeCustom || "Not provided"}
Mood: ${mood}
Main Figure: ${safeFigure || "Not provided"}

${memePageMode ? `
Requirements for Meme Page Mode:
- Create a strong, funny, and detailed Grok Image Prompt in PART 2
- Make titles and captions highly searchable
- Focus on maximum reach and engagement
` : ''}
`;

    const messages = [{ role: "system", content: systemPrompt }];

    if (imageBase64 && imageMime) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt + "\n\nAnalyze the uploaded image and create meme content based on it." },
          { type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}` } }
        ]
      });
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: imageBase64 ? "gpt-4o" : "gpt-4o-mini",
        messages,
        temperature: 0.9,
        max_tokens: 3000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data?.error?.message || "OpenAI API failed" });
    }

    const content = data?.choices?.[0]?.message?.content || "Generation completed.";
    return res.status(200).json({ success: true, content });

  } catch (err) {
    console.error("Generation error:", err);
    return res.status(500).json({ success: false, error: "Generation failed" });
  }
};
