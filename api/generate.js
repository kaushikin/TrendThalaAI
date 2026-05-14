module.exports = async (req, res) => {
  // CORS for safety
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, details, mood, figure, colors, effect } = req.body || {};

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on Vercel' });
  }

  const systemPrompt = `You are Trend Thala AI — the #1 viral content creator for Tamil YouTube Shorts & Instagram Reels. 
You speak in natural Tamil-English mix and create super-engaging, dramatic, curiosity-driven content for Tamil audience.`;

  const userPrompt = `Generate a complete TREND THALA AI CONTENT PACK using these inputs:

Topic: ${topic}
Key Details: ${details || 'No additional details'}
Mood: ${mood || 'Dramatic'}
Main Figure: ${figure || 'None'}
Color Style: ${colors || 'Dark political'}
Effect: ${effect || 'Fire'}

Output **EXACTLY** in this format (no extra text, no explanations):

:fire: TREND THALA AI CONTENT PACK

TOPIC:
${topic}

KEY DETAILS:
${details || ''}

MOOD:
${mood}

MAIN FIGURE:
${figure || ''}

----------------------------------------

PART 1: POSTER PROMPT
[Highly detailed vertical 9:16 poster prompt optimized for mobile. Include Tamil headline suggestions, mood, colors, effect, main figure, layout instructions.]

----------------------------------------

PART 2: YOUTUBE SHORTS 5 SCENES
SCENE 1 — HOOK:
SCENE 2 — PROBLEM/DATA:
SCENE 3 — TWIST:
SCENE 4 — QUESTION:
SCENE 5 — CTA:
[Make scenes dynamic and highly relevant to the topic]

----------------------------------------

PART 3: YOUTUBE SHORTS TITLE
[One catchy title with emojis, Tamil-English mix]

----------------------------------------

PART 4: YOUTUBE DESCRIPTION
[Full description + social links exactly like this:
:loudspeaker: Telegram: https://t.me/iPeTrK9edbA5MTU9
:camera_with_flash: Instagram: https://www.instagram.com/anpavaam
:blue_book: Facebook: https://facebook.com/share/1B6BCWHJJY
+ relevant hashtags]

----------------------------------------

PART 5: TAMIL VOICE OVER
[Full natural spoken Tamil script, 30-45 seconds, energetic and conversational]

----------------------------------------

PART 6: INSTAGRAM CAPTION
[Short punchy caption + hashtags]

Make everything highly viral, creative, and perfect for Tamil creators.`;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2200,
      }),
    });

    if (!openaiRes.ok) throw new Error('OpenAI API error');

    const data = await openaiRes.json();
    const content = data.choices[0].message.content.trim();

    res.status(200).json({ success: true, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'AI generation failed – using local fallback' });
  }
};
