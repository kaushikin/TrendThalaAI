module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "OpenAI key missing"
      });
    }

    const {
      topic = "",
      details = "",
      links = "",
      custom = "",
      mood = "Powerful",
      figure = "",
      style = "mr-tamilan",

      // New optional SEO fields
      platform = "both",
      audience = "",
      mainKeyword = "",
      goal = "views",
      imageInstruction = "",

      imageBase64 = null,
      imageMime = null
    } = req.body || {};

    const clean = (value, max = 1500) => {
      return String(value || "").trim().slice(0, max);
    };

    const safeTopic = clean(topic, 250);
    const safeDetails = clean(details, 2000);
    const safeLinks = clean(links, 1000);
    const safeCustom = clean(custom, 1000);
    const safeFigure = clean(figure, 120);
    const safeAudience = clean(audience, 300);
    const safeKeyword = clean(mainKeyword, 120);
    const safeImageInstruction = clean(imageInstruction, 500);

    if (!safeTopic && !safeDetails && !imageBase64) {
      return res.status(400).json({
        success: false,
        error: "Please provide a topic, details, or image."
      });
    }

    const styleMap = {
      "mr-tamilan": "Energetic Tamil creator style — dramatic, direct, punchy, fast-paced.",
      "behindwoods": "Professional Tamil entertainment news style — clean, polished, engaging.",
      "cinema-vikatan": "Spicy Tamil cinema gossip style — catchy, but avoid defamation.",
      "star-sports": "Passionate Tamil sports commentator style — emotional, energetic.",
      "tech-satish": "Clear Tamil tech explainer style — simple, useful, practical.",
      "tamil-motivational": "Emotional Tamil motivational style — inspiring and powerful.",
      "meme": "Balanced meme style — funny, educative, meaningful, shareable."
    };

    const selectedStyle = styleMap[style] || styleMap["mr-tamilan"];

    const systemPrompt = `
You are Trend Thala AI — a Tamil-English viral content strategist for YouTube Shorts, Instagram Reels, meme posters, and creator SEO.

Your main job:
Create content that improves reach using:
- YouTube Shorts SEO
- Instagram Reels SEO
- Strong first 2-second hook
- Retention structure
- Rewatch loop
- Comment triggers
- Share/save triggers
- Tamil audience psychology
- Mobile-first short-form storytelling

Tone:
Tamil-English mixed, viral Tamil creator style, punchy, clear, emotional when needed.

Important safety rules:
- Do not create fake claims.
- Do not present unverified news as confirmed fact.
- For politics, celebrities, crime, controversy, social issues, or sensitive topics, use safe wording:
  "reports say", "social media buzz", "as per current updates", "official confirmation pending", "many people are discussing".
- Avoid personal abuse, hate speech, and defamatory statements.
- For awareness content, keep it balanced, meaningful, and solution-focused.
- If the uploaded image contains a person, do not identify the person only from the image unless the user already gave the name/topic. Describe visual elements and connect them to the provided context.

Image handling rules:
- If an image is uploaded, first analyze visible elements.
- Connect image details with the topic, details, and custom instruction.
- Mention if image and topic do not clearly match.
- Use the image to improve meme angle, poster prompt, thumbnail text, hook, and caption.
- If image has text, extract/interpret visible text if possible.
- If image is unclear, say what can be reasonably seen and still create useful content.

SEO rules:
- YouTube title must include searchable keywords.
- YouTube description first 2 lines must include main topic keyword.
- Instagram caption first line must include topic keyword naturally.
- Do not overuse hashtags.
- YouTube hashtags: 3 to 5 only.
- Instagram hashtags: 8 to 15 only, relevant and grouped.
- Avoid random hashtags like #viral if not useful.
- Create hooks for retention, not clickbait.

Output EXACTLY in this format:

PART 1: Image Analysis and Context Connection

PART 2: Viral Hook Options

PART 3: SEO Keyword Strategy

PART 4: YouTube Shorts Title Options

PART 5: YouTube SEO Description

PART 6: Full 5-Scene Shorts Script

PART 7: Poster / Thumbnail Prompt

PART 8: Instagram Caption + Instagram SEO Alt Text

PART 9: Voiceover Script (Pure Tamil)

PART 10: Hashtag Strategy

PART 11: Pinned Comment Ideas

PART 12: Meme / Thumbnail Text Ideas

PART 13: CapCut Editing Suggestions

PART 14: Best Posting Strategy
`;

    const userPrompt = `
Create a SEO-optimized viral content pack for Trend Thala AI.

Topic / Headline:
${safeTopic || "Not provided"}

Key Details:
${safeDetails || "Not provided"}

Source / Reference Links:
${safeLinks || "Not provided"}

Special Instructions:
${safeCustom || "Not provided"}

Mood:
${mood}

Main Figure:
${safeFigure || "Not provided"}

Creator Style:
${selectedStyle}

Target Platform:
${platform}
Options meaning:
- both = YouTube Shorts + Instagram Reels
- youtube = YouTube Shorts only
- instagram = Instagram Reels only

Target Audience:
${safeAudience || "Tamil social media audience"}

Main SEO Keyword:
${safeKeyword || safeTopic || "Tamil trending topic"}

Content Goal:
${goal}
Possible goals:
views, comments, shares, saves, followers

Image Context Instruction:
${safeImageInstruction || "If image is uploaded, analyze it and connect it strongly with the topic."}

Must include:
1. Image-context connection if image is uploaded.
2. 5 strong hook options.
3. YouTube searchable title options.
4. Instagram caption with SEO keywords.
5. YouTube description with keywords in first 2 lines.
6. 5-scene Shorts script with:
   - scene visual
   - on-screen text
   - voiceover
   - retention trick
7. Pure Tamil voiceover script in PART 9.
8. Hashtags separated for YouTube and Instagram.
9. Pinned comment to increase comments.
10. Posting tips for better reach.
11. Keep it Tamil creator friendly and copy-paste ready.

Very important:
If image is uploaded, do not ignore it. Explain:
- What is visible
- What emotion/message it gives
- How it connects to topic
- Best meme/poster angle from image
`;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    if (imageBase64 && imageMime) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: userPrompt + "\n\nUploaded image is attached. Analyze it carefully and connect it with the topic."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${imageMime};base64,${imageBase64}`
            }
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: userPrompt + "\n\nNo image uploaded. Generate based on topic and details."
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: imageBase64 ? "gpt-4o" : "gpt-4o-mini",
        messages,
        temperature: 0.82,
        max_tokens: 3500
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);

      return res.status(response.status).json({
        success: false,
        error: data?.error?.message || "OpenAI API failed"
      });
    }

    const content = data?.choices?.[0]?.message?.content || "Generation completed.";

    return res.status(200).json({
      success: true,
      content
    });

  } catch (err) {
    console.error("Generation error:", err);

    return res.status(500).json({
      success: false,
      error: "Generation failed"
    });
  }
};
