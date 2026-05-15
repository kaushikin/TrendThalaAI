module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, details, links, custom, mood, figure, style, imageBase64, imageMime } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI key missing' });

  // Style mapping
  const styleMap = {
    "mr-tamilan": "Write in Mr Tamilan style — energetic, dramatic, direct, uses words like அப்பப்பா, Shock ஆகிடுவீங்க, Machi, Full Explained",
    "behindwoods": "Write in Behindwoods style — professional, detailed, slightly formal but exciting, good for movie updates",
    "cinema-vikatan": "Write in Cinema Vikatan style — spicy, curious, fast-paced, gossip-style language",
    "star-sports": "Write in Star Sports Tamil style — passionate, dramatic, cricket commentator energy, uses words like Sixer!, Massive!",
    "tech-satish": "Write in Tech Satish style — clear, exciting, simple Tamil, tech YouTuber tone",
    "tamil-motivational": "Write in Tamil Motivational style — emotional, powerful, inspiring, deep voice energy"
  };

  const styleInstruction = styleMap[style] || styleMap["mr-tamilan"];

  const systemPrompt = `You are Trend Thala AI — Expert Tamil YouTube Shorts Creator.

**Content Style:** ${styleInstruction}

**TTS Recommendation:** k2-fsa/OmniVoice (best for voice cloning) + ai4bharat/indic-parler-tts

Output **EXACTLY** in this format:`;

  const outputFormat = `
PART 1: Image / Reference Analysis

PART 2: Viral Hook

PART 3: YouTube Shorts Titles (3 Best)

PART 4: YouTube Shorts Description

PART 5: Full Shorts Script

PART 6: Grok Image Generation Prompt (9:16)

PART 7: Grok Text-to-Video Prompt (6-10s scenes)

PART 8: Grok Image-to-Video Prompt

PART 9: Voiceover Script (Pure Tamil - TTS Ready)

PART 10: Thumbnail Text Ideas (3 Bold Options)

PART 11: Instagram Caption + 5 Hashtags

PART 12: CapCut Editing Suggestions`;

  let userContent = `Topic: ${topic || 'No topic'}
Details: ${details || 'None'}
Links: ${links || 'None'}
Custom Instructions: ${custom || 'None'}
Mood: ${mood || 'Dramatic'}
Figure: ${figure || 'None'}
Content Style: ${style || 'mr-tamilan'}`;

  let messages = [{ role: "system", content: systemPrompt + outputFormat }];

  if (imageBase64 && imageMime) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userContent + "\nAnalyze this image creatively." },
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
        temperature: 0.93,
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
