export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { topic, details, mood, figure, colors, effect } = req.body || {};

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const prompt = `
You are Trend Thala AI, an AI content factory for Tamil creators.

Create a complete viral Tamil content pack.

Topic:
${topic}

Key Details:
${details || "No extra details provided"}

Mood:
${mood || "Dramatic"}

Main Figure:
${figure || "None"}

Color Style:
${colors || "Dark political"}

Effect:
${effect || "Fire"}

Output format:

PART 1: POSTER PROMPT
Create a detailed 9:16 mobile-first Tamil news poster prompt.

PART 2: YOUTUBE SHORTS 5 SCENES
Create 5 scenes, each 10 seconds, with visual, text, effect, sound.

PART 3: YOUTUBE SHORTS TITLE
Give 3 title options under 60 characters if possible.

PART 4: YOUTUBE DESCRIPTION
Give a viral description with context and question.

PART 5: TAMIL VOICE OVER
Give short Tamil voiceover text.

PART 6: INSTAGRAM CAPTION
Give Reels caption with hashtags.

Style:
Tamil-English mixed.
Punchy.
Mobile-first.
Viral Tamil audience tone.
No fake facts beyond given details.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a Tamil viral content strategist for YouTube Shorts, Instagram Reels, news posters and creator content.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data.error?.message || "OpenAI API error",
      });
    }

    const output = data.choices?.[0]?.message?.content || "";

    return res.status(200).json({ output });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}
