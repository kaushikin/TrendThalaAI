module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, details, links, mood, figure, colors, effect, imageBase64, imageMime } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI key not configured' });

  let messages = [{
    role: "system",
    content: "You are Trend Thala AI — expert Tamil viral content creator. Always output in the exact PART 1 to PART 10 format."
  }];

  let userText = `Topic: ${topic || 'No topic'}
Key Details: ${details || 'None'}
Source Links: ${links || 'None'}
Mood: ${mood || 'Dramatic'}
Main Figure: ${figure || 'None'}
Colors: ${colors || 'Dark political'}
Effect: ${effect || 'Fire'}`;

  if (imageBase64) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userText + "\n\nAnalyze the uploaded reference image in detail and use visual observations in the content." },
        { type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}` }}
      ]
    });
  } else {
    messages.push({ role: "user", content: userText });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.85,
        max_tokens: 2800,
      }),
    });

    const data = await openaiRes.json();
    let content = data.choices[0].message.content.trim();

    // Extract Grok prompts (simple regex fallback)
    const imagePromptMatch = content.match(/PART 4: Grok Image Generation Prompt[\s\S]*?(?=PART 5:|$)/i);
    const videoPromptMatch = content.match(/PART 5: Grok Text-to-Video Prompt[\s\S]*?(?=PART 6:|$)/i);

    res.status(200).json({
      success: true,
      content: content,
      grokImagePrompt: imagePromptMatch ? imagePromptMatch[0] : "Grok Image Prompt not generated",
      grokVideoPrompt: videoPromptMatch ? videoPromptMatch[0] : "Grok Video Prompt not generated"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'AI failed – using fallback' });
  }
};
