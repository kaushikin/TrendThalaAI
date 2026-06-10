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
      style = "mr-tamilan",
      platform = "both",
      audience = "",
      goal = "views",
      tone = "Funny",
      imageBase64 = null,
      imageMime = null,
      highEngagement = false,
      memePageMode = false
    } = req.body || {};

    const clean = (value, max = 2000) => String(value || "").trim().slice(0, max);

    const safeTopic = clean(topic, 300);
    const safeDetails = clean(details, 2500);
    const safeLinks = clean(links, 1200);
    const safeCustom = clean(custom, 1200);
    const safeFigure = clean(figure, 150);
    const safeAudience = clean(audience, 400);
    const safeGoal = clean(goal, 60);
    const safeTone = clean(tone, 60);

    if (!safeTopic && !safeDetails && !imageBase64) {
      return res.status(400).json({ success: false, error: "Please provide a topic, details, or image." });
    }

    const styleMap = {
      "mr-tamilan": "High-energy, dramatic, direct, punchy Tamil creator style with strong hooks and personality.",
      "behindwoods": "Professional, polished, exciting entertainment/news style.",
      "cinema-vikatan": "Spicy, fast-paced, gossip-style with curiosity.",
      "star-sports": "Passionate, emotional, high-energy commentator style.",
      "tech-satish": "Clear, simple, practical, and exciting tech explanation style.",
      "tamil-motivational": "Emotional, inspiring, powerful, and story-driven style.",
      "meme": "Funny, relatable, shareable, meme-style content."
    };

    const selectedStyle = styleMap[style] || styleMap["mr-tamilan"];

    let modeInstruction = "";
    if (memePageMode) {
      modeInstruction = `**MEME PAGE MODE**: Focus on funny, relatable, highly shareable meme content. Make visuals bold and meme-style.`;
    }
    if (highEngagement) {
      modeInstruction += `**HIGH ENGAGEMENT MODE**: Prioritize maximum retention, emotional hooks, pattern interrupts, and strong calls-to-action.`;
    }

    const systemPrompt = `
You are a world-class expert in viral short-form content creation and advanced prompt engineering for Grok (image & video generation).

Your goal is to produce **extremely high-quality, ready-to-use content and Grok prompts** that feel 100% professional and high-converting — especially for affiliate marketing in Clothing and Unique Products categories.

### Core Rules (Must Follow Strictly):
1. Think step-by-step before generating each section.
2. Every output must feel premium, natural, and emotionally engaging.
3. Use advanced storytelling techniques: strong hooks, emotional triggers, curiosity, social proof, and clear benefit.
4. For Clothing: Focus on styling, look enhancement, fabric feel, occasion, and visual transformation.
5. For Unique Products: Highlight surprise factor, usefulness, "you didn't know you needed this" angle.
6. Voiceover must start with a powerful hook in first 3-5 seconds and maintain high energy.
7. Grok Image & Video prompts must be extremely detailed, structured, and cinematic.
8. Avoid generic or average language. Every line should feel intentional and high-quality.

${modeInstruction}

Output **EXACTLY** in this format with high-quality content:

PART 1: Content Concept & Strategy
PART 2: Grok Image Prompt (Highly Detailed 9:16 Poster)
PART 3: Grok Text-to-Video Prompt (Structured + Cinematic)
PART 4: Grok Voiceover Script (Powerful Hook + Engaging Delivery)
PART 5: YouTube Title Options (Best Performing)
PART 6: YouTube Description (SEO + Strong CTA)
PART 7: Instagram Caption + Hashtags (High Engagement)
PART 8: Thumbnail Text Ideas (Click-worthy)
`;

    const userPrompt = `
Create premium-quality affiliate content.

Topic: ${safeTopic || "Not provided"}
Key Details: ${safeDetails || "Not provided"}
Product Link / Extra Info: ${safeLinks || "Not provided"}
Special Instructions: ${safeCustom || "Not provided"}
Mood: ${mood}
Main Figure / Model: ${safeFigure || "Not provided"}
Creator Style: ${selectedStyle}
Target Platform: ${platform}
Target Audience: ${safeAudience || "Tamil audience"}
Content Goal: ${safeGoal}
Tone: ${safeTone}

Generate the highest quality output possible following all rules above. Focus on making the voiceover and Grok prompts exceptionally strong and professional.
`;

    const messages = [{ role: "system", content: systemPrompt }];

    if (imageBase64 && imageMime) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt + "\n\nAn image is uploaded. Analyze it deeply and create content around it." },
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
        temperature: 0.88,
        max_tokens: 4200
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
