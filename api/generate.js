module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, details, sourceLinks, specialInstructions, mood, figure, colors, effect } = req.body || {};

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI key not configured' });
  }

  const systemPrompt = `You are Trend Thala AI — Viral Tamil YouTube Shorts & Reels content expert. Create super engaging, curiosity-driven, Tamil-English mixed content.`;

  const userPrompt = `Create a complete VIRAL YouTube Short Pack:

Topic: ${topic}
Key Details: ${details || 'No extra details'}
Source/Reference: ${sourceLinks || 'None'}
Special Instructions: ${specialInstructions || 'None'}
Mood: ${mood || 'Dramatic'}
Main Figure: ${figure || 'None'}
Colors: ${colors || 'Dark political'}
Effect: ${effect || 'Fire'}

Output **exactly** in this format (no extra explanations):

🔥 TREND THALA AI CONTENT PACK

TOPIC: ${topic}

KEY DETAILS: ${details || ''}

MOOD: ${mood}
MAIN FIGURE: ${figure}

----------------------------------------

PART 1: POSTER PROMPT
[Ultra-detailed 9:16 vertical poster prompt for AI image generator. Include Tamil headline ideas, main figure, mood, colors, effect, dramatic layout.]

----------------------------------------

PART 2: 5-SCENE YOUTUBE SHORTS SCRIPT
SCENE 1 — HOOK:
SCENE 2 — PROBLEM/DATA:
SCENE 3 — TWIST:
SCENE 4 — QUESTION / REACTION:
SCENE 5 — CTA:

----------------------------------------

PART 3: YOUTUBE SHORTS TITLE
[One super catchy title with emojis]

----------------------------------------

PART 4: YOUTUBE DESCRIPTION
[Full description with social links + hashtags]

----------------------------------------

PART 5: TAMIL VOICE OVER
[Natural, energetic spoken Tamil script ~30-45 seconds]

----------------------------------------

PART 6: INSTAGRAM CAPTION + HASHTAGS

Make it highly viral for Tamil audience.`;

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
        temperature: 0.85,
        max_tokens: 2400,
      }),
    });

    if (!openaiRes.ok) throw new Error('OpenAI error');

    const data = await openaiRes.json();
    const content = data.choices[0].message.content.trim();

    res.status(200).json({ success: true, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'AI failed - fallback activated' });
  }
};
