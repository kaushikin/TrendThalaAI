module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, details, links, custom, mood, figure, style, imageBase64, imageMime } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI key missing' });

  let systemPrompt = `You are Trend Thala AI — Expert Tamil YouTube Shorts & Meme Creator.`;

  // Special Meme Mode
  if (style === "meme" || (custom && custom.toLowerCase().includes("meme"))) {
    systemPrompt += `
**MODE: VIRAL MEME POSTER**
- Create super viral, funny, relatable Tamil meme style
- Use bold, big text, dramatic reactions, trending meme formats
- Heavy use of Tamil slang, emojis, shock value, and sarcasm
- Perfect for YouTube Shorts thumbnail + Instagram post
- Focus on maximum shareability and laugh factor`;
  } else {
    systemPrompt += `
**Content Style:** ${style === "mr-tamilan" ? "Energetic Mr Tamilan style" : 
                    style === "behindwoods" ? "Professional Behindwoods style" : 
                    style === "cinema-vikatan" ? "Spicy Cinema Vikatan gossip style" : "Energetic style"}`;
  }

  systemPrompt += `

Output **EXACTLY** in this format:`;

  const outputFormat = `
PART 1: Image / Reference Analysis (Meme Potential)

PART 2: Viral Hook (Super Catchy)

PART 3: YouTube Shorts Titles (3 Best Meme Style)

PART 4: YouTube Shorts Description (with hashtags)

PART 5: Full Shorts Script (Tamil + English mix)

PART 6: Grok Meme Poster Prompt (9:16 - Very Detailed)

PART 7: Grok Text-to-Video Prompt

PART 8: Grok Image-to-Video Prompt

PART 9: Voiceover Script (Pure Tamil)

PART 10: Thumbnail / Meme Text Ideas (3 Bold Options)

PART 11: Instagram Caption + 5 Viral Hashtags

PART 12: CapCut Editing Suggestions (Meme Style)`;

  let userContent = `Topic: ${topic || 'No topic'}
Details: ${details || 'None'}
Custom: ${custom || 'None'}
Mood: ${mood || 'Funny'}
Figure: ${figure || 'None'}
Mode: ${style === "meme" ? "Meme Poster Mode" : "Normal"}`;

  let messages = [{ role: "system", content: systemPrompt + outputFormat }];

  if (imageBase64 && imageMime) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userContent + "\nAnalyze this image for meme potential. Focus on facial expressions, text, and how to make it funny/viral." },
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
        temperature: 0.95,        // High creativity for memes
        max_tokens: 4200
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Generation completed.";

    res.json({ success: true, content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Generation failed' });
  }
};
