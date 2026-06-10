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

    const clean = (value, max = 1500) => String(value || "").trim().slice(0, max);

    const safeTopic = clean(topic, 250);
    const safeDetails = clean(details, 2000);
    const safeLinks = clean(links, 1000);
    const safeCustom = clean(custom, 1000);
    const safeFigure = clean(figure, 120);
    const safeAudience = clean(audience, 300);
    const safeGoal = clean(goal, 50);
    const safeTone = clean(tone, 50);

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

    let modeInstruction = "";
    if (memePageMode) {
      modeInstruction = `**MEME PAGE MODE ACTIVATED** - Focus on funny, shareable meme content.`;
    }
    if (highEngagement) {
      modeInstruction += `**HIGH ENGAGEMENT MODE ACTIVATED** - Create powerful hooks and high-retention content.`;
    }

    const systemPrompt = `
You are an expert Grok Prompt Engineer specialized in creating powerful, hooky, and engaging voiceover scripts for Tamil YouTube Shorts and Instagram Reels.

${modeInstruction}

### Voiceover Script Rules (PART 4) - VERY IMPORTANT:
- Start with a **strong hook in the first 3-5 seconds** (question, shocking fact, direct address, or curiosity gap).
- Use short, punchy sentences.
- Make it emotional and energetic according to the selected Tone.
- Add natural rhythm and flow suitable for Shorts (fast delivery).
- Use the selected Creator Style (especially Mr Tamilan style when chosen).
- End with a strong line that makes people want to watch till the end or comment.

Output EXACTLY in this format:

PART 1: Image Analysis & Repurposing Idea
PART 2: Grok Image Prompt (Regenerated Poster - 9:16 Vertical)
PART 3: Grok Text-to-Video Prompt (Single Powerful Structured Prompt)
PART 4: Grok Voiceover Script (Strong Hook + Powerful & Engaging Tamil)
PART 5: YouTube Title Options (SEO Optimized)
PART 6: YouTube Description
PART 7: Instagram Caption + Hashtags
PART 8: Thumbnail Text Ideas
`;

    const userPrompt = `
${imageBase64 ? "An image has been uploaded. Analyze it carefully and create content based on it." : ""}

Topic: ${safeTopic || "Not provided"}
Details: ${safeDetails || "Not provided"}
Custom Instructions: ${safeCustom || "Not provided"}
Mood: ${mood}
Main Figure: ${safeFigure || "Not provided"}
Creator Style: ${selectedStyle}
Target Platform: ${platform}
Target Audience: ${safeAudience || "Tamil social media audience"}
Content Goal: ${safeGoal}
Tone: ${safeTone}

Generate high-quality Grok prompts. Make the voiceover script (PART 4) especially powerful, hooky, and engaging.
`;

    const messages = [{ role: "system", content: systemPrompt }];

    if (imageBase64 && imageMime) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
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
        temperature: 0.87,
        max_tokens: 4000
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
