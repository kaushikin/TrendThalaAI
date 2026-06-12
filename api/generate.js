module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "OpenAI key missing" });
    }

    const {
      topic = "",
      details = "",
      links = "",
      custom = "",
      mood = "Powerful",
      figure = "",
      style = "mr-tamilan",
      platform = "both",
      audience = "",
      goal = "views",
      tone = "Funny",
      contentAngle = "auto",
      voiceoverLanguage = "tamil",
      imageBase64 = null,
      imageMime = null,
      highEngagement = false,
      memePageMode = false,
      affiliateMode = false
    } = req.body || {};

    const clean = (value, max = 2000) => String(value || "").trim().slice(0, max);

    const safeTopic = clean(topic, 300);
    const safeDetails = clean(details, 2500);
    const safeLinks = clean(links, 1200);
    const safeCustom = clean(custom, 1200);
    const safeFigure = clean(figure, 150);
    const safeAudience = clean(audience, 400);
    const safeGoal = clean(goal, 60);
    const safeTone = clean(tone, 60);
    const safeAngle = clean(contentAngle, 60);
    const safeVoiceLang = ["tamil", "english", "tanglish"].includes(String(voiceoverLanguage).toLowerCase())
      ? String(voiceoverLanguage).toLowerCase()
      : "tamil";

    if (!safeTopic && !safeDetails && !imageBase64) {
      return res.status(400).json({ success: false, error: "Please provide a topic, details, or image." });
    }

    // ---- Hard validation: affiliate link without details is not allowed ----
    if (safeLinks && !safeDetails) {
      return res.status(400).json({
        success: false,
        error: "A product link was provided but Key Details / Product Description is empty. Please add real product details (features, price, fabric/material, etc.) so the content is accurate. Avoid generating claims about a product the AI cannot see."
      });
    }

    const styleMap = {
      "mr-tamilan": "High-energy, dramatic, direct, punchy Tamil creator style with strong personality.",
      "behindwoods": "Professional, polished, exciting entertainment/news style.",
      "cinema-vikatan": "Spicy, fast-paced, gossip-style with curiosity.",
      "star-sports": "Passionate, emotional, high-energy commentator style.",
      "tech-satish": "Clear, simple, practical, and exciting tech explanation style.",
      "tamil-motivational": "Emotional, inspiring, powerful, and story-driven style.",
      "meme": "Funny, relatable, shareable, meme-style content."
    };
    const selectedStyle = styleMap[style] || styleMap["mr-tamilan"];

    const voiceLangMap = {
      tamil: `Write voiceover_script almost entirely in Tamil script (தமிழ்), with only unavoidable English brand/product/tech terms left in English. For audiences who read/speak pure Tamil.`,
      english: `Write voiceover_script entirely in English. For audiences who prefer English content (pan-India / NRI / English-speaking viewers).`,
      tanglish: `Write voiceover_script in natural Tanglish (mixed Tamil + English, in Latin script), matching how young Tamil creators actually speak. Default for general Tamil social media audiences.`
    };
    const voiceLanguageInstruction = voiceLangMap[safeVoiceLang] || voiceLangMap.tamil;


    const angleMap = {
      styling: `Use the "3 Ways to Style This" structure: open on the item, then show 3 quick styling/usage variations, end on the best/favorite one.`,
      first_impression: `Use the "Unboxing / First Impression" structure: open with anticipation/curiosity, reveal the product, react to first impression, end with a verdict line.`,
      comparison: `Use the "Budget vs Premium Comparison" structure: contrast this item against a common alternative (cheaper or more expensive), highlight the difference that matters most, end with a recommendation.`,
      problem_solution: `Use the "Problem → This Fixes It" structure: open by showing/describing a relatable problem, introduce the product as the fix, show the payoff, end with a CTA.`,
      auto: `Choose whichever proven short-form structure (styling demo, first impression, comparison, or problem-solution) best fits the given topic and details.`
    };
    const angleInstruction = angleMap[safeAngle] || angleMap.auto;

    // ---- News/Trend format map (originality & variety, non-affiliate content) ----
    const formatMap = {
      hot_take: `Format: HOT TAKE. Open by stating the news/topic in one line, then immediately give a strong, opinionated take on it (per "Your Take" below). The whole video is built around defending/explaining that opinion.`,
      explainer: `Format: EXPLAINER. Open with a "wait, what's actually going on here?" hook, then break down the situation in 2-3 simple beats, ending with what it means going forward.`,
      reaction: `Format: REACTION. Open showing/describing the moment that caused buzz, then react to it in real time tone — surprise, agreement, disagreement — woven with "Your Take".`,
      story_time: `Format: STORY-TIME. Open with a narrative hook ("Oru nimisham..." / "So this happened..."), tell the situation as a mini-story with a beginning-middle-twist structure, end with the takeaway.`,
      debate_pov: `Format: DEBATE / POV. Present the topic as two sides briefly, then land firmly on "Your Take" as the stance, inviting viewers to agree/disagree in comments.`,
      auto: `Choose whichever of these formats (Hot Take, Explainer, Reaction, Story-time, Debate/POV) best fits the topic and "Your Take" provided — vary it naturally rather than defaulting to the same one every time.`
    };
    const safeFormat = clean(req.body?.contentFormat || "auto", 60);
    const formatInstruction = formatMap[safeFormat] || formatMap.auto;

    const safeYourTake = clean(req.body?.yourTake || "", 1500);

    // ---- Mode modifiers ----
    let modeNotes = [];
    if (memePageMode) {
      modeNotes.push(
        `MEME PAGE MODE: This is an image-only post (no video, no voiceover). ` +
        `Set "video_prompt" and "voiceover_script" to empty strings "". ` +
        `Make "image_prompt" bold, funny, meme-style, text-heavy, and highly shareable. ` +
        `Still fill in titles, description, caption, hashtags, and thumbnail_text normally.`
      );
    }
    if (highEngagement) {
      modeNotes.push(
        `HIGH ENGAGEMENT MODE: Push hooks and pacing to maximum intensity. Use stronger ` +
        `emotional triggers (shock, curiosity, anger, inspiration), pattern interrupts, ` +
        `and cliffhangers. Prioritize watch-time and comments over subtlety.`
      );
    }
    if (affiliateMode) {
      modeNotes.push(
        `AFFILIATE PRODUCT MODE: This content promotes a real product for affiliate ` +
        `commission (Amazon/Flipkart). ${angleInstruction} ` +
        `CRITICAL ACCURACY RULE: Only mention features, materials, price, or specs that ` +
        `appear in the "Key Details" provided by the user. Do NOT invent specifications, ` +
        `prices, ratings, or claims. If something isn't in the details, keep that part ` +
        `general/aspirational instead of inventing facts. ` +
        `Always populate "affiliate_disclosure" with a short, natural disclosure line ` +
        `(e.g. "Affiliate link in bio/description — I may earn a small commission on ` +
        `purchases made through it."), in Tamil-English mix matching the overall tone, ` +
        `and APPEND this disclosure line at the end of both "youtube_description" and ` +
        `"instagram_caption".`
      );
    } else {
      modeNotes.push(`Set "affiliate_disclosure" to an empty string "".`);
    }

    const modeInstructions = modeNotes.join("\n");

    // ---- System prompt ----
    const systemPrompt = `
You are an expert short-form video content strategist and Grok prompt engineer for Tamil YouTube Shorts and Instagram Reels.

You must respond with ONLY a single valid JSON object — no markdown fences, no commentary, no PART labels, nothing outside the JSON. The JSON must exactly match this schema (all keys required, use empty string "" or empty array [] where a field doesn't apply):

{
  "concept": "string - 1-2 sentence content concept and strategy",
  "image_prompt": "string - highly detailed Grok image prompt, 9:16 vertical poster",
  "video_prompt": "string - time-coded Grok video prompt (see VIDEO PROMPT RULES)",
  "voiceover_script": "string - Tamil voiceover script (see VOICEOVER RULES)",
  "youtube_titles": ["string", "string", "string"],
  "youtube_description": "string - SEO description with CTA",
  "instagram_caption": "string - caption with relevant hashtags woven in naturally",
  "hashtags": { "youtube": ["string", "..."], "instagram": ["string", "..."] },
  "thumbnail_text": ["string", "string", "string"],
  "affiliate_disclosure": "string",
  "content_angle_used": "string - short label of the structure used",
  "originality_notes": "string - 1-2 sentences on what makes THIS video's angle/commentary original (for the creator's own reference, not for posting)"
}

=== VOICEOVER RULES (voiceover_script) ===
- LANGUAGE: ${voiceLanguageInstruction}
- The opening hook (first 2-4 seconds, roughly 8-12 words MAX) must use ONE of these patterns:
  1. Direct question to viewer ("Idha vachu paathaala?")
  2. Bold claim / shock fact ("Ithu 299 dhaan, aana...")
  3. Pattern interrupt / contradiction ("Ellarum ithai thappa pannranga")
  4. Direct address / "stop scrolling" style
  5. Before-you-buy warning ("Itha vaangurathuku munnadi itha paarunga")
- Total script should be roughly 25-35 words (matches a 10-second video at natural pace), adjusted naturally for the chosen language above.
- End with either a comment/follow/save CTA, or a curiosity-gap line.
- Example hook style for reference (do not copy verbatim, match the energy):
  "Bro, idha 3 naal use pannitu sொnnen — life changed!"

=== VIDEO PROMPT RULES (video_prompt) ===
Always output video_prompt in this exact 4-segment, time-coded structure (10-second video), filling in the bracketed parts:

[0:00-0:02] Opening shot: <hook visual matching the voiceover hook, camera angle, motion, and matching the composition described in image_prompt so it can be used as the first frame (image-to-video)>
[0:02-0:05] Reveal/context: <subject/product shown clearly, camera movement, setting>
[0:05-0:08] Benefit/payoff shot: <key visual moment, lighting, action, emotional peak>
[0:08-0:10] Closing shot + text overlay: <final framing, on-screen CTA text>

Style: <visual style e.g. cinematic/meme/dramatic>, 9:16 vertical, <color grading note>, <pacing note>
On-screen text: <exact overlay text per segment, short and bold>

Note: image_prompt should describe the scene used for [0:00-0:02] in detail so the same generated image can be fed into Grok's image-to-video as the starting frame.

=== IMAGE PROMPT RULES (image_prompt) ===
- Extremely detailed: composition, subject placement, text overlay style/position, lighting, color palette, mood, 9:16 vertical.
- Must visually correspond to the [0:00-0:02] segment of video_prompt.

=== ORIGINALITY & FORMAT RULES (Critical for monetization eligibility) ===
This channel was previously flagged for "reused content" by YouTube. Every script you
generate MUST feel like an original take from a real creator, not a repackaged news
summary. Follow these rules:

- ${formatInstruction}
- "Your Take" provided by the creator: ${safeYourTake || "Not provided — generate a clear, defensible opinion/angle yourself and state it explicitly in the script."}
- The voiceover_script MUST center on this opinion/angle, not just restate the news.
  Phrases like "என் opinion-ல", "எனக்கு தோணுச்சு", "Honestly", "I think" (in the
  selected language) should anchor the take.
- Do NOT write generic "here's what happened" news-anchor narration as the dominant
  tone — that pattern is what gets flagged as repetitive/reused.
- "originality_notes" must briefly state what specific opinion/angle/twist makes this
  video different from a plain news recap.

=== MODE INSTRUCTIONS ===
${modeInstructions}

=== GENERAL ===
- Use Target Platform, Target Audience, Content Goal, and Tone to shape titles, captions, and hashtags.
- Creator Style: ${selectedStyle}
- Keep youtube_titles to 3 strong, SEO-searchable options.
- thumbnail_text: 3 short, bold, click-worthy text options.
- Output valid JSON only.
`;

    const userPrompt = `
${imageBase64 ? "An image has been uploaded — analyze it carefully and base image_prompt and video_prompt's opening segment on it." : ""}

Topic / Product Name: ${safeTopic || "Not provided"}
Key Details / Product Description: ${safeDetails || "Not provided"}
Product Link (for context only, do not assume unseen specs): ${safeLinks || "Not provided"}
Special Instructions: ${safeCustom || "Not provided"}
Mood: ${mood}
Main Figure / Model: ${safeFigure || "Not provided"}
Target Platform: ${platform}
Target Audience: ${safeAudience || "Tamil social media audience"}
Content Goal: ${safeGoal}
Tone: ${safeTone}

Generate the JSON object now.
`;

    const messages = [{ role: "system", content: systemPrompt }];

    if (imageBase64 && imageMime) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}` } }
        ]
      });
    } else {
      messages.push({ role: "user", content: userPrompt });
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
        temperature: highEngagement ? 0.9 : 0.85,
        max_tokens: 4200,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({ success: false, error: data?.error?.message || "OpenAI API failed" });
    }

    const raw = data?.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return res.status(200).json({
        success: false,
        error: "Model returned invalid JSON. Showing raw output.",
        raw
      });
    }

    // Ensure all expected keys exist (defensive defaults)
    const safeOut = {
      concept: parsed.concept || "",
      image_prompt: parsed.image_prompt || "",
      video_prompt: parsed.video_prompt || "",
      voiceover_script: parsed.voiceover_script || "",
      youtube_titles: Array.isArray(parsed.youtube_titles) ? parsed.youtube_titles : [],
      youtube_description: parsed.youtube_description || "",
      instagram_caption: parsed.instagram_caption || "",
      hashtags: {
        youtube: Array.isArray(parsed?.hashtags?.youtube) ? parsed.hashtags.youtube : [],
        instagram: Array.isArray(parsed?.hashtags?.instagram) ? parsed.hashtags.instagram : []
      },
      thumbnail_text: Array.isArray(parsed.thumbnail_text) ? parsed.thumbnail_text : [],
      affiliate_disclosure: parsed.affiliate_disclosure || "",
      content_angle_used: parsed.content_angle_used || "",
      originality_notes: parsed.originality_notes || ""
    };

    return res.status(200).json({ success: true, data: safeOut });

  } catch (err) {
    console.error("Generation error:", err);
    return res.status(500).json({ success: false, error: "Generation failed" });
  }
};
