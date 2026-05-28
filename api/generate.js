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
      mainKeyword = "",
      goal = "views",
      imageInstruction = "",
      imageBase64 = null,
      imageMime = null,
      highEngagement = false
    } = req.body || {};

    const clean = (value, max = 1500) => String(value || "").trim().slice(0, max);

    const safeTopic = clean(topic, 250);
    const safeDetails = clean(details, 2000);
    const safeLinks = clean(links, 1000);
    const safeCustom = clean(custom, 1000);
    const safeFigure = clean(figure, 120);
    const safeAudience = clean(audience, 300);
    const safeKeyword = clean(mainKeyword, 120);
    const safeImageInstruction = clean(imageInstruction, 500);

    if (!safeTopic && !safeDetails && !imageBase64) {
      return res.status(400).json({ success: false, error: "Please provide a topic, details, or image." });
    }

    const styleMap = {
      "mr-tamilan": "Energetic Tamil creator style — dramatic, direct, punchy, fast-paced.",
      "behindwoods": "Professional Tamil entertainment news style — clean, polished, engaging.",
      "cinema-vikatan": "Spicy Tamil cinema gossip style — catchy, but avoid defamation.",
      "star-sports": "Passionate Tamil sports commentator style — emotional, energetic.",
      "tech-satish": "Clear Tamil tech explainer style — simple, useful, practical.",
      "tamil-motivational": "Emotional Tamil motivational style — inspiring and powerful.",
      "meme": "Balanced meme style — funny, educative, meaningful, shareable."
    };

    const selectedStyle = styleMap[style] || styleMap["mr-tamilan"];

    let engagementBoost = "";
    if (highEngagement) {
      engagementBoost = `
**HIGH ENGAGEMENT MODE ACTIVATED**
- Make hooks extremely powerful (shock, curiosity, anger, inspiration)
- Add pattern interrupts and cliffhangers
- Make the script more dramatic and fast-paced
`;
    }

    const systemPrompt = `
You are Trend Thala AI — a Tamil-English viral content strategist for YouTube Shorts and Instagram Reels.

${engagementBoost}

=== GROK VIDEO PROMPT RULES ===
Write ONE single, powerful, all-in-one Text-to-Video prompt that includes:
- Scene descriptions
- Camera movements
- Editing effects
- Text overlays
- Transitions
- Pacing
- Tamil cultural style

Output EXACTLY in this format:
PART 1: Image Analysis and Context Connection
PART 2: Viral Hook Options
PART 3: SEO Keyword Strategy
PART 4: YouTube Shorts Title Options
PART 5: YouTube SEO Description
PART 6: Grok Poster Prompt (9:16 - Very Detailed)
PART 7: Grok Text-to-Video Prompt (Single Powerful Prompt - Include all editing, effects, camera, text, transitions)
PART 8: Instagram Caption + Hashtags
PART 9: Voiceover Script (Start with strong hook, Pure Tamil)
PART 10: Hashtag Strategy
PART 11: Pinned Comment Ideas
PART 12: Thumbnail Text Ideas
PART 13: Best Posting Strategy
`;

    const userPrompt = `
Create a SEO-optimized viral content pack.

Topic: ${safeTopic || "Not provided"}
Details: ${safeDetails || "Not provided"}
Custom Instructions: ${safeCustom || "Not provided"}
Mood: ${mood}
Creator Style: ${selectedStyle}
Main Keyword: ${safeKeyword || safeTopic}
Goal: ${goal}
Image Context: ${safeImageInstruction || "Analyze uploaded image and connect with topic if available"}

Requirements:
- Make PART 7 a single powerful all-in-one Grok Text-to-Video prompt
- Include editing effects, camera movements, text overlays, and transitions inside PART 7
- Keep it clean and easy to copy
`;

    const messages = [{ role: "system", content: systemPrompt }];

    if (imageBase64 && imageMime) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt + "\n\nAnalyze the uploaded image and connect it with the topic." },
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
        temperature: highEngagement ? 0.88 : 0.82,
        max_tokens: 3500
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
