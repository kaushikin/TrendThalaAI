module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, details, links, mood, figure, colors, effect, imageBase64, imageMime } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI key missing' });

  const systemPrompt = `You are **Trend Thala AI** — inspired by Mr. Tamilan style.
Mr. Tamilan Style: Energetic Tamil voice-over, simple explanations, high curiosity, emotional hooks, clear storytelling for Tamil audience who want quick entertainment.

**Tamil SEO Strategy:**
- Use high-search Tamil + English mix keywords: "வைரல்", "பகிருங்கள்", "ஷாக்", "என்ன நடந்தது", "Full Explained", "Tamil Voice Over", "Mr Tamilan Style"
- Clickbait + emotional + question titles
- Add trending hashtags naturally

**Grok Video Rules:** Every scene maximum 6-10 seconds.

Output **EXACTLY** in this format only:`;

  const format = `
PART 1: Image / Reference Analysis
PART 2: Viral Tamil Content Pack (Mr.Tamilan Style)
PART 3: YouTube Shorts Titles (3 powerful options with Tamil SEO)
PART 4: YouTube Description (SEO optimized + keywords + hashtags)
PART 5: Grok Image Generation Prompt (9:16 vertical, bold Tamil text)
PART 6: Grok Text-to-Video Prompt (6-10s scenes only)
PART 7: Grok Image-to-Video Prompt (if image given, 6-10s animation)
PART 8: Tamil Voiceover Script (Mr.Tamilan energetic style)
PART 9: Instagram Caption + Hashtags (Tamil SEO rich)
PART 10: 5 Scene Breakdown (with timing)`;

  let userContent = `Topic: ${topic || 'No topic'}
Details: ${details || 'None'}
Links: ${links || 'None'}
Mood: ${mood || 'Dramatic'}
Figure: ${figure || 'None'}
Colors: ${colors || 'Dark bold'}
Effect: ${effect || 'Cinematic fire'}`;

  let messages = [{ role: "system", content: systemPrompt + format }];

  if (imageBase64 && imageMime) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userContent + "\n\nAnalyze the reference image and use visual clues in Mr.Tamilan style." },
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
        temperature: 0.82,
        max_tokens: 3400
      })
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "Generation failed.";

    res.json({ success: true, content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'AI error' });
  }
};
