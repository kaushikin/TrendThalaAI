module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, details, links, custom, mood, figure, imageBase64, imageMime } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI key missing' });

  const systemPrompt = `You are **Trend Thala AI** — Specialist in Mr Tamilan Style YouTube Shorts.

**Mr Tamilan Viral Hook Formulas:**
- Strong curiosity hooks: "என்ன நடந்தது?", "அப்பப்பா இது!", "Shock ஆகிடுவீங்க!", "இது உங்களுக்கு தெரியுமா?"
- Emotional + Dramatic + Fast storytelling
- Always 15-60 seconds Shorts friendly

**CapCut Editing Style:**
- Fast cuts (every 4-8 seconds)
- Big bold Tamil text with zoom & animation
- Trending transitions, fire, lightning, beat sync

**Important Rules:**
- Strictly follow Custom Instructions (if user says "No voice over", completely remove PART 8)
- Focus only on YouTube Shorts
- Use strong Tamil SEO keywords

Output **EXACTLY** in this format only:`;

  const outputFormat = `
PART 1: Image / Reference Analysis
PART 2: Viral Hook (First 3-5 seconds)
PART 3: YouTube Shorts Titles (3 Super Clickbait)
PART 4: Full Shorts Content Flow / Script
PART 5: Grok Image Generation Prompt (9:16)
PART 6: Grok Text-to-Video Prompt (6-10s scenes)
PART 7: Grok Image-to-Video Prompt
PART 8: Tamil Voiceover Script (Mr Tamilan Style) - Skip if custom says no voice over
PART 9: CapCut Editing Template Suggestions
PART 10: Hashtags & SEO Keywords`;

  let userContent = `Topic: ${topic || 'No topic'}
Details: ${details || 'None'}
Links: ${links || 'None'}
Mood: ${mood || 'Dramatic'}
Figure: ${figure || 'None'}
Custom Instructions: ${custom || 'None'}`;

  let messages = [{ role: "system", content: systemPrompt + outputFormat }];

  if (imageBase64 && imageMime) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userContent + "\nAnalyze image and generate in Mr Tamilan Shorts style." },
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
        temperature: 0.88,
        max_tokens: 3200
      })
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "Generation failed.";

    res.json({ success: true, content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Generation failed' });
  }
};
