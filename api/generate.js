// api/generate.js  —  TrendThala backend  (Node / Express route)
// POST /api/generate

const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── SAFE DEFAULT OUTPUT ────────────────────────────────────────────────────
const SAFE_OUT = {
  concept: '',
  image_prompt: '',
  video_prompt: '',
  voiceover: '',
  titles: '',
  description: '',
  caption: '',
  hashtags_yt: '',
  hashtags_ig: '',
  thumbnail_text: '',
  disclosure_line: '',
  originality_notes: '',
};

// ── FORMAT CONFIGS ─────────────────────────────────────────────────────────
const FORMAT_RULES = {
  hottake: {
    label: 'Hot Take',
    voiceInstruction: 'Lead with a bold, controversial opinion as the hook. State your take in the first 4 seconds, then back it up with 1–2 sharp facts. End with a challenge to the viewer.',
    conceptNote: 'This is a personal opinion Short. The voiceover must clearly express the creator\'s view, not neutral narration.',
  },
  explainer: {
    label: 'Explainer',
    voiceInstruction: 'Break down the topic in simple terms. Use the structure: "Here\'s what happened → here\'s why it matters → here\'s what you need to know." No jargon.',
    conceptNote: 'Educational Short. Prioritise clarity and context over hype.',
  },
  reaction: {
    label: 'Reaction',
    voiceInstruction: 'React authentically to the news/trend. Express genuine emotion (surprise, excitement, disbelief). Phrase as "I can\'t believe..." or "Wait, did you see this?" before explaining.',
    conceptNote: 'Reaction Short — energy and authenticity matter more than polish here.',
  },
  storytime: {
    label: 'Story-time',
    voiceInstruction: 'Tell the story in chronological narrative. Use "So here\'s what happened..." as the opener. Build tension toward a reveal or twist. First person where possible.',
    conceptNote: 'Narrative Short — hook the viewer with story structure, not just facts.',
  },
  debate: {
    label: 'Debate / POV',
    voiceInstruction: 'Frame this as "Here\'s why [X] is right/wrong." Present the opposing view briefly (5 sec) then dismantle it. End with your verdict.',
    conceptNote: 'POV Short — designed to drive comments and debate. Strong, clear stance required.',
  },
};

// ── LANGUAGE CONFIGS ───────────────────────────────────────────────────────
function langInstructions(voiceLang) {
  if (voiceLang === 'tamil') {
    return `Write the ENTIRE voiceover script in pure Tamil (Tamil script: தமிழ்). No English words unless the word has no Tamil equivalent (e.g. brand names). Natural spoken Tamil, not formal.`;
  }
  if (voiceLang === 'english') {
    return `Write the entire voiceover script in English. Clear, punchy, conversational. Avoid translating Tamil-specific cultural context — just explain it directly.`;
  }
  // Default: Tanglish
  return `Write the voiceover script in Tanglish — natural mix of spoken Tamil and English written in Latin script (Roman letters). This is how ANPAVAAM's Tamil audience actually speaks. Example style: "Bro, idu nambave mudiyala — Vijay ippadi oru move pannitaar, antha crowd reaction paaru..." Do NOT write in Tamil script.`;
}

// ── AFFILIATE ANGLE CONFIGS ────────────────────────────────────────────────
const AFFILIATE_ANGLES = {
  styling:         'Structure: "3 ways to style/use [product]" — show versatility, not features.',
  firstimpression: 'Structure: Unboxing-first-impression — "I didn\'t expect this to be this good." Lead with surprise, then back it up with 2 real details.',
  comparison:      'Structure: Side-by-side comparison — cheap alternative vs this product. Be honest. Specify price difference.',
  problemsolution: 'Structure: Problem → Solution. Name a real problem your audience has, then position this product as the fix. Be specific.',
  auto:            'Choose the content angle most likely to drive clicks for this product type and price point. Explain your choice in originality_notes.',
};

// ── HOOK PATTERNS ──────────────────────────────────────────────────────────
const HOOK_PATTERNS = [
  '(Number) + (Surprising fact) — e.g. "90% of people don\'t know this about Vijay\'s plan"',
  'Controversy opener — e.g. "This is going to make people angry..."',
  'Cliffhanger — e.g. "What happened next shocked everyone..."',
  'Direct challenge — e.g. "You need to see this before it gets deleted"',
  'Personal reaction — e.g. "I literally couldn\'t believe this when I saw it..."',
];

// ── SYSTEM PROMPT BUILDER ─────────────────────────────────────────────────
function buildSystemPrompt({ format, voiceLang, modes, affiliate }) {
  const fmt = FORMAT_RULES[format] || FORMAT_RULES.hottake;
  const langRule = langInstructions(voiceLang);
  const isAffiliate = modes.affiliate && affiliate;
  const isMeme = modes.meme;

  const affiliateAngleRule = isAffiliate
    ? `\nAFFILIATE CONTENT ANGLE: ${AFFILIATE_ANGLES[affiliate.angle] || AFFILIATE_ANGLES.auto}`
    : '';

  const disclosureRule = isAffiliate
    ? `\nDISCLOSURE: You MUST append "#ad #affiliate" at the end of both the YouTube description and Instagram caption. Also generate a standalone disclosure_line field: "Affiliate link in bio. This is a paid/sponsored mention. #ad"`
    : '';

  const memeRule = isMeme
    ? `\nMEME PAGE MODE: This is meme/entertainment content. Set voiceover = "" (empty string) and video_prompt should describe a meme-style reel, not a product/news video.`
    : '';

  return `You are the content engine for ANPAVAAM, a Tamil YouTube Shorts channel that covers trending news, politics (TVK / Vijay), viral moments, and cinema buzz — always with the creator's own commentary and take, NOT generic narration.

CHANNEL IDENTITY:
- Original commentary-first Shorts (not reposts, not clip compilations)
- Creator's personal opinions and reactions are the spine of every video
- Audience: Tamil speakers, 16–35, interested in politics + entertainment + viral culture
- Visual style: Bold, high-contrast, text overlays, Grok-generated AI visuals

YOUR JOB:
Generate a complete JSON object for one piece of content. Every field must be filled (except disclosure_line when not affiliate mode, and voiceover/video in meme mode).

FORMAT THIS VIDEO: ${fmt.label}
${fmt.conceptNote}

VOICEOVER RULES:
${langRule}
- Hook: MUST match one of these 5 patterns:
${HOOK_PATTERNS.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
- Hook must be under 12 words, delivered in under 4 seconds
- Total voiceover: 30–40 words (matches 10-second Short pacing)
- Voiceover instruction for this format: ${fmt.voiceInstruction}
- NEVER use generic openers like "Hey guys" or "Welcome back"
- The creator's take/opinion MUST be present, not just facts${affiliateAngleRule}${disclosureRule}${memeRule}

VIDEO PROMPT RULES (Grok, 10-second Short):
Time-code every segment. The opening segment (0–2s) MUST visually match the image_prompt so the poster can be used as the image-to-video starting frame.
Format exactly like:
[0–2s] Hook shot — [describe scene]
[2–5s] Context reveal — [describe scene]
[5–8s] Payoff / benefit — [describe scene]
[8–10s] CTA + text overlay — [describe scene, overlay text]

IMAGE PROMPT RULES:
Cinematic, bold, high-contrast. Specify: subject, lighting, angle, mood, style (e.g. "dramatic rim lighting, low angle, dark background, bold Tamil text overlay"). No people's real faces.

TITLES: Generate 3 title options. Mix styles: one curiosity gap, one bold statement, one question. All under 60 chars.

DESCRIPTION: YouTube description, 80–120 words, includes timestamps if applicable, channel links.

CAPTION: Instagram caption, punchy, under 150 chars, ends with CTA.

HASHTAGS_YT: 8 YouTube hashtags (mix Tamil + English, trend-relevant).

HASHTAGS_IG: 15 Instagram hashtags.

THUMBNAIL_TEXT: 3–5 bold words for thumbnail overlay. ALL CAPS. Maximum visual impact.

ORIGINALITY NOTES:
In the originality_notes field, write 1–2 sentences for the creator explaining: (1) what makes this piece of content original vs generic narration of the same topic, and (2) one tip to vary the format next time to avoid the "content factory" pattern. Address the creator directly ("Your hook here...")

CRITICAL: Respond with ONLY a valid JSON object. No preamble, no markdown backticks, no explanation. Start with { and end with }.

JSON SCHEMA:
{
  "concept": "string — content concept, hook strategy, and format rationale",
  "image_prompt": "string — Grok image prompt",
  "video_prompt": "string — time-coded 10-second video prompt",
  "voiceover": "string — voiceover script in specified language",
  "titles": "string — 3 title options, one per line",
  "description": "string — YouTube description",
  "caption": "string — Instagram caption",
  "hashtags_yt": "string — YouTube hashtags",
  "hashtags_ig": "string — Instagram hashtags",
  "thumbnail_text": "string — thumbnail overlay text",
  "disclosure_line": "string — affiliate disclosure (empty string if not affiliate mode)",
  "originality_notes": "string — channel health note for the creator"
}`;
}

// ── USER PROMPT BUILDER ────────────────────────────────────────────────────
function buildUserPrompt({ topic, yourTake, keyDetails, affiliate, modes }) {
  let prompt = `TOPIC: ${topic}`;

  if (yourTake) {
    prompt += `\n\nCREATOR'S TAKE (use this as the voiceover spine — this is their actual opinion):
${yourTake}`;
  }

  if (keyDetails) {
    prompt += `\n\nKEY DETAILS TO INCLUDE:
${keyDetails}`;
  }

  if (modes.affiliate && affiliate) {
    if (affiliate.productLink) {
      prompt += `\n\nPRODUCT LINK: ${affiliate.productLink}
NOTE: You cannot read this link. All product details come from what is provided below.`;
    }
    if (affiliate.productDetails) {
      prompt += `\n\nPRODUCT DETAILS (use ONLY these — do not invent specs):
${affiliate.productDetails}`;
    }
  }

  return prompt;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    topic, yourTake = '', keyDetails = '',
    voiceLang = 'tanglish', format = 'hottake',
    modes = { meme: false, engage: true, affiliate: false },
    affiliate = null,
  } = req.body;

  // Validate
  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Topic is required.' });
  }
  if (modes.affiliate && affiliate?.productLink && !affiliate?.productDetails?.trim()) {
    return res.status(400).json({
      error: 'You pasted a product link but Key Details is empty. GPT cannot read Amazon/Flipkart links — fill in the real product name, price, and features to avoid hallucinated specs.'
    });
  }

  const systemPrompt = buildSystemPrompt({ format, voiceLang, modes, affiliate });
  const userPrompt   = buildUserPrompt({ topic, yourTake, keyDetails, affiliate, modes });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1800,
      temperature: 0.82,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Strip accidental markdown fences
      const clean = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    }

    // Merge with safe defaults so no field is ever missing
    const output = { ...SAFE_OUT, ...parsed };

    // Meme page mode: clear voiceover + disclosure
    if (modes.meme) {
      output.voiceover = '';
    }
    // Non-affiliate: clear disclosure
    if (!modes.affiliate) {
      output.disclosure_line = '';
    }

    return res.status(200).json(output);

  } catch (err) {
    console.error('TrendThala generate error:', err);
    return res.status(500).json({ error: err.message || 'Generation failed. Try again.' });
  }
};
