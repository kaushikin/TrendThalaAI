module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, details, links, custom, mood, figure, imageBase64, imageMime } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI key missing' });

  const systemPrompt = `You are Trend Thala AI — a top Tamil YouTube Shorts creator like Mr Tamilan.

Style: Mix of Tamil + English (natural spoken style). Energetic, dramatic, and viral.
Use words like "அப்பப்பா", "Shock ஆகிடுவீங்க", "என்ன நடந்தது", "Full Explained", "Viral", "Trending".

**Rules:**
- Make high-quality, engaging YouTube Shorts content (15-60 seconds)
- Always generate YouTube Description and Instagram Caption
- Follow custom instructions strictly
- If image is given, use only safe visual description

Output **EXACTLY** in this format:`;

  const outputFormat = `
PART 1: Image / Reference Analysis (visual only)

PART 2: Viral Hook (First 3-5 seconds)

PART 3: YouTube Shorts Titles (3 Best Clickbait Options)

PART 4: YouTube Shorts Description (SEO + hashtags + CTA)

PART 5: Full Shorts Script / Content Flow

PART 6: Grok Image Generation Prompt (9:16 vertical poster)

PART 7: Grok Text-to-Video Prompt (6-10s scenes)

PART 8: Grok Image-to-Video Prompt

PART 9: Tamil Voiceover Script (Mr Tamilan Style) - Skip if custom says no

PART 10: Instagram Caption + 5 Best Hashtags

PART 11: CapCut Editing Suggestions`;

  let userContent = `Topic: ${topic || 'No topic'}
Details: ${details || 'None'}
Links: ${links || 'None'}
Custom Instructions: ${custom || 'None'}
Mood: ${mood || 'Dramatic'}
Figure: ${figure || 'None'}`;

  let messages = [{ role: "system", content: systemPrompt + outputFormat }];

  if (imageBase64 && imageMime) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userContent + "\n\nDescribe only visible elements safely." },
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
        temperature: 0.9,
        max_tokens: 3500
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
