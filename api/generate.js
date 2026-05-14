module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, details, links, custom, mood, figure, imageBase64, imageMime } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI key missing' });

  const systemPrompt = `You are Trend Thala AI — Expert for Mr Tamilan Style YouTube Shorts.

**Important Vision Rules:**
- If an image is provided, describe only visible objects, colors, mood, text, background, and composition.
- NEVER identify real people, celebrities, or faces by name.
- Just say "a person", "a man", "a crowd", "a political figure", etc.
- Focus on visual elements useful for content creation.

**Mr Tamilan Shorts Style:**
- Strong curiosity hooks: "என்ன நடந்தது?", "அப்பப்பா!", "Shock ஆகிடுவீங்க!"
- Fast 15-60 second format.

Output **EXACTLY** in this format:`;

  const outputFormat = `
PART 1: Image / Reference Analysis (only visual elements)
PART 2: Viral Hook (First 3-5 seconds)
PART 3: YouTube Shorts Titles (3 Clickbait Options)
PART 4: Full Shorts Content Flow
PART 5: Grok Image Generation Prompt (9:16)
PART 6: Grok Text-to-Video Prompt (6-10s scenes)
PART 7: Grok Image-to-Video Prompt
PART 8: Tamil Voiceover Script (Skip if custom says no voice over)
PART 9: CapCut Editing Template Suggestions
PART 10: Hashtags & SEO Keywords`;

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
          text: userContent + "\n\nDescribe only the visible visual elements, colors, mood, and composition in the image. Do not identify specific people." 
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
        temperature: 0.85,
        max_tokens: 3200
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ success: false, error: data.error.message });
    }

    const content = data.choices[0]?.message?.content || "Generation completed.";

    res.json({ success: true, content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Generation failed' });
  }
};
