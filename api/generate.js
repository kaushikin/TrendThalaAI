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

  // Style Handling
  if (style === "meme") {
    systemPrompt += `
**MODE: VIRAL MEME POSTER (Balanced)**
- Create powerful memes that are **funny + educative + meaningful**
- Mix humor with strong message, life lessons, shocking facts, or social awareness
- Use bold Tamil text, reactions, and trending meme formats
- Make it shareable and thought-provoking`;
  } else {
    const styleMap = {
      "mr-tamilan": "Energetic Mr Tamilan style — dramatic, direct, uses அப்பப்பா, Shock ஆகிடுவீங்க, Machi",
      "behindwoods": "Professional Behindwoods style — detailed, exciting movie/news tone",
      "cinema-vikatan": "Spicy Cinema Vikatan gossip style — curious and fast-paced",
      "star-sports": "Star Sports Tamil commentator style — passionate and dramatic",
      "tech-satish": "Clear Tech Satish style — simple and exciting explanations",
      "tamil-motivational": "Emotional Tamil Motivational style — inspiring and powerful"
    };
    systemPrompt += `**Content Style:** ${styleMap[style] || styleMap["mr-tamilan"]}`;
  }

  systemPrompt += `

Output **EXACTLY** in this format:`;

  const outputFormat = `
PART 1: Image / Reference Analysis (Meme & Message Potential)

PART 2: Viral Hook

PART 3: YouTube Shorts Titles (3 Best)

PART 4: YouTube Shorts Description

PART 5: Full Shorts Script (Tamil + English mix)

PART 6: Grok Meme Poster Prompt (9:16 - Bold & Powerful)

PART 7: Grok Text-to-Video Prompt

PART 8: Grok Image-to-Video Prompt

PART 9: Voiceover Script (Pure Tamil)

PART 10: Thumbnail / Meme Text Ideas (3 Strong Options)

PART 11: Instagram Caption + 5 Viral Hashtags

PART 12: CapCut Editing Suggestions`;

  let userContent = `Topic: ${topic || 'No topic'}
Details: ${details || 'None'}
Custom Instructions: ${custom || 'None'}
Mood: ${mood || 'Powerful'}
Figure: ${figure || 'None'}
Mode: ${style === "meme" ? "Balanced Meme (Funny + Educative + Meaningful)" : "Normal"}`;

  let messages = [{ role: "system", content: systemPrompt + outputFormat }];

  if (imageBase64 && imageMime) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userContent + "\nAnalyze this image for strong meme + meaningful content potential." },
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
        temperature: style === "meme" ? 0.92 : 0.9,
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
