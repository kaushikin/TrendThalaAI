module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { topic, details, links, mood, figure, colors, effect, imageBase64, imageMime } = req.body;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({error: "OpenAI key missing"});

  let userContent = `Topic: ${topic || 'No topic'}
Details: ${details || 'None'}
Links: ${links || 'None'}
Mood: ${mood}
Figure: ${figure || 'None'}
Colors: ${colors}
Effect: ${effect}`;

  let messages = [
    { role: "system", content: `You are Trend Thala AI. Create high-quality viral Tamil content.
Output **exactly** in this format with clear PART numbers:` + `

PART 1: Image / Reference Analysis
PART 2: Viral Tamil Content Pack
PART 3: YouTube Shorts Title (3 options, very clickbait)
PART 4: YouTube Description (SEO + hashtags)
PART 5: Grok Image Generation Prompt (very detailed 9:16 poster)
PART 6: Grok Text-to-Video Prompt (5 scenes)
PART 7: Grok Image-to-Video Prompt (use reference image if given)
PART 8: Tamil Voiceover Script
PART 9: Instagram Caption + Hashtags
PART 10: 5 Scene Breakdown for Shorts` }
  ];

  if (imageBase64) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userContent + "\n\nAnalyze this reference image and use visual details." },
        { type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}` } }
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
        max_tokens: 3000
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract Grok prompts
    const imageMatch = content.match(/PART 5: Grok Image Generation Prompt[\s\S]*?(?=PART 6:|$)/i);
    const videoMatch = content.match(/PART 6: Grok Text-to-Video Prompt[\s\S]*?(?=PART 7:|$)/i);

    res.json({
      content: content,
      grokImagePrompt: imageMatch ? imageMatch[0] : "No image prompt generated",
      grokVideoPrompt: videoMatch ? videoMatch[0] : "No video prompt generated"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Generation failed" });
  }
};
