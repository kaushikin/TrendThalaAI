module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, details, links, custom, mood, figure, imageBase64, imageMime } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI key missing' });

  const systemPrompt = `You are Trend Thala AI — Expert Mr Tamilan Style Tamil YouTube Shorts Creator.

**Voiceover Style:** Natural Tamil + English code-switching, energetic, dramatic, and engaging.
Example: "Machi, இது என்னடா நடந்தது? Vijay became CM and Suriya is back after 13 years – அப்பப்பா shock ஆகிடுவீங்க da!"

**Best Free Tamil TTS Tools:**
- ai4bharat/indic-parler-tts (Best quality)
- Nidum-Madurai-Tamil-TTS
- CapCut built-in Tamil voices
- Google Translate TTS (quick)

Output **EXACTLY** in this format:`;

  const outputFormat = `
PART 1: Image / Reference Analysis (Detailed visual + meme potential)

PART 2: Viral Hook (Strong 3-5 seconds)

PART 3: YouTube Shorts Titles (3 Best Clickbait Options)

PART 4: YouTube Shorts Description (SEO + CTA)

PART 5: Full Shorts Script (Natural Tamil + English mix)

PART 6: Grok Image Generation Prompt (9:16 vertical)

PART 7: Grok Text-to-Video Prompt (6-10s scenes)

PART 8: Grok Image-to-Video Prompt

PART 9: Voiceover Script (Bilingual Tamil + English) + Free TTS Guide

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
        { type: "text", text: userContent + "\n\nAnalyze this image creatively for viral Shorts content." },
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
        max_tokens: 4000
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
