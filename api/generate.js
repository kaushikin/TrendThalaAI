module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, details, links, custom, mood, figure, imageBase64, imageMime } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI key missing' });

  const systemPrompt = `You are **Trend Thala AI** — a highly creative, expert Tamil YouTube Shorts creator in Mr Tamilan style.

**Your Goal:** Generate HIGH-QUALITY, detailed, viral content that is as good as or better than direct ChatGPT.

**Style:**
- Natural Tamil + English code-switching
- Energetic, dramatic, emotional, meme-style
- Use words like: அப்பப்பா, Shock ஆகிடுவீங்க, என்ன நடந்தது, Machi, Full Explained, Karuppu, Mass, Fire

**Image Analysis Rules:**
- Be detailed and creative when describing images
- Focus on visual impact, emotions, colors, composition, and meme potential
- Do NOT refuse — always provide useful creative suggestions

**Output Format (EXACTLY):**`;

  const outputFormat = `
PART 1: Image / Reference Analysis (Detailed & Creative)

PART 2: Viral Hook (Strong 3-5 sec opener)

PART 3: YouTube Shorts Titles (3 Best Clickbait)

PART 4: YouTube Shorts Description (SEO + CTA + Hashtags)

PART 5: Full Shorts Script / Content Flow (Tamil-English mix)

PART 6: Grok Image Generation Prompt (Detailed 9:16)

PART 7: Grok Text-to-Video Prompt (6-10s scenes)

PART 8: Grok Image-to-Video Prompt

PART 9: Voiceover Guide (Free Methods - Azure, CapCut, etc.)

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
        { 
          type: "text", 
          text: userContent + "\n\nAnalyze this image in detail. Focus on visual impact, emotions, meme potential, colors, and how to make it viral for Tamil audience. Be creative and helpful." 
        },
        { 
          type: "image_url", 
          image_url: { url: `data:${imageMime};base64,${imageBase64}` } 
        }
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
        temperature: 0.95,     // Higher creativity
        max_tokens: 4000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Generation failed.";

    res.json({ success: true, content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Generation failed' });
  }
};
