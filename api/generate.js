module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { topic, details, links, mood, figure, colors, effect, imageBase64, imageMime } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OpenAI key missing" });

  const systemPrompt = `You are **Trend Thala AI** — the #1 Tamil viral content expert for news, politics, cinema, and meme creators.

**Core Rules:**
- Always think like a top Tamil YouTube Shorts / Reels creator (think Mr. Tamilan, FactTamil, etc.)
- Use powerful Tamil slang, emotional triggers, curiosity gaps, and FOMO.
- Never hallucinate facts. Use only user-provided details + visible image context.
- Make content highly shareable in Tamil Nadu / Tamil diaspora.
- Output **EXACTLY** in the numbered PART format below. No extra text.

**OUTPUT FORMAT (strict):**

PART 1: Image / Reference Analysis
[If image uploaded: Describe key visuals, expressions, text, mood, colors seen]

PART 2: Viral Tamil Content Pack
[Short powerful summary + 5-7 key hooks]

PART 3: YouTube Shorts Titles
Option 1: [Most Clickbait]
Option 2: [Emotional]
Option 3: [Question Style]

PART 4: YouTube Description
[SEO optimized + timestamps if possible + call to action + hashtags]

PART 5: Grok Image Generation Prompt
[Ultra-detailed 9:16 vertical poster. Bold Tamil text, cinematic lighting, mood & effect mentioned. Ready to paste in Grok.]

PART 6: Grok Text-to-Video Prompt
[5 scenes × 8-10 seconds each. Fast cuts, Tamil text overlays, sound suggestions, vertical 9:16, high energy]

PART 7: Grok Image-to-Video Prompt
[If reference image given: "Start with this exact image and animate it..." + camera moves, zooms, text popups, transitions]

PART 8: Tamil Voiceover Script
[Natural, energetic Tamil script with emotion]

PART 9: Instagram Caption + Hashtags
[Short punchy caption + 12-15 trending hashtags]

PART 10: 5 Scene Breakdown
[Visual + Text Overlay for each scene]`;

  let userContent = `Topic: ${topic || 'No topic given'}
Key Details: ${details || 'None'}
Source Links: ${links || 'None'}
Mood: ${mood || 'Dramatic'}
Main Figure: ${figure || 'None'}
Color Style: ${colors || 'Dark & Bold'}
Visual Effect: ${effect || 'Cinematic Fire'}`;

  let messages = [{ role: "system", content: systemPrompt }];

  if (imageBase64 && imageMime) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userContent + "\n\nAnalyze the uploaded reference image carefully and incorporate visible details." },
        { type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}` }}
      ]
    });
  } else {
    messages.push({ role: "user", content: userContent });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.85,
        max_tokens: 3200
      })
    });

    const data = await response.json();
    const fullContent = data.choices[0]?.message?.content || "Generation failed.";

    // Smart extraction of Grok prompts
    const grokImageMatch = fullContent.match(/PART 5: Grok Image Generation Prompt[\s\S]*?(?=PART 6:|$)/i);
    const grokVideoMatch = fullContent.match(/PART 6: Grok Text-to-Video Prompt[\s\S]*?(?=PART 7:|$)/i);

    res.json({
      content: fullContent,
      grokImagePrompt: grokImageMatch ? grokImageMatch[0].trim() : "Grok Image Prompt not found",
      grokVideoPrompt: grokVideoMatch ? grokVideoMatch[0].trim() : "Grok Video Prompt not found"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI Generation failed" });
  }
};
