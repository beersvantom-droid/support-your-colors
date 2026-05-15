export type CommentatorId = "jeroen" | "sierd" | "fabrizio";

export interface CommentatorDef {
  id: CommentatorId;
  name: string;
  emoji: string;
  tagline: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  badgeText: string;
}

export const COMMENTATORS: Record<CommentatorId, CommentatorDef> = {
  jeroen: {
    id: "jeroen",
    name: "Jeroen Bijma",
    emoji: "😈",
    tagline: "Football Twitter",
    accentColor: "#DC2626",
    bgColor: "rgba(220,38,38,0.06)",
    borderColor: "rgba(220,38,38,0.18)",
    badgeText: "PROVOCATEUR",
  },
  sierd: {
    id: "sierd",
    name: "Sierd de Vos",
    emoji: "😴",
    tagline: "Dry Analysis",
    accentColor: "#6B7280",
    bgColor: "rgba(107,114,128,0.05)",
    borderColor: "rgba(107,114,128,0.15)",
    badgeText: "ANALYST",
  },
  fabrizio: {
    id: "fabrizio",
    name: "Fabrizio Romano",
    emoji: "🚨",
    tagline: "Breaking Updates",
    accentColor: "#2563EB",
    bgColor: "rgba(37,99,235,0.06)",
    borderColor: "rgba(37,99,235,0.18)",
    badgeText: "BREAKING",
  },
};

// ─── Tone detection ───────────────────────────────────────────────────────────

export type ToneCategory =
  | "high_confidence"
  | "doubt"
  | "trash_talk"
  | "celebration"
  | "cryptic"       // very short post (≤5 words)
  | "night_chaos"   // 01:00–05:00 Amsterdam
  | "derby"         // upcoming derby within 24h
  | "neutral";

const TONE_KEYWORDS: Record<Exclude<ToneCategory, "cryptic" | "night_chaos" | "derby" | "neutral">, string[]> = {
  high_confidence: [
    "winning", "champion", "unstoppable", "gonna win", "will win", "unbeatable",
    "best team", "number one", "legend", "clean sweep", "easy win", "no chance for",
    "dominating", "inevitable", "guaranteed", "title is ours",
  ],
  doubt: [
    "hope", "nervous", "worried", "scared", "please", "pray", "not sure",
    "maybe", "fingers crossed", "difficult", "tough match", "praying",
    "anxiety", "sweating", "could go either way",
  ],
  trash_talk: [
    "trash", "terrible", "useless", "no chance", "out already", "eliminated",
    "joke team", "embarrassing", "pathetic", "exposed", "going home", "pack your bags",
  ],
  celebration: [
    "yes!", "let's go", "amazing", "incredible", "unreal", "perfect",
    "we won", "we're through", "qualified", "into the next round", "what a goal",
    "scenes", "unbelievable", "masterclass",
  ],
};

export function detectTone(caption: string | null | undefined): ToneCategory {
  if (!caption) return "neutral";
  const lower = caption.toLowerCase();
  const wordCount = caption.trim().split(/\s+/).length;
  if (wordCount <= 5) return "cryptic";

  for (const [tone, keywords] of Object.entries(TONE_KEYWORDS) as [ToneCategory, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return tone;
  }
  return "neutral";
}

// ─── Comment reply templates (comment under a post) ──────────────────────────
// These are short, direct reactions — not standalone broadcast posts.

type CommentTemplate = string | ((ctx: { country?: string; flag?: string }) => string);

const COMMENT_TEMPLATES: Record<ToneCategory, Record<CommentatorId, CommentTemplate[]>> = {
  high_confidence: {
    jeroen: [
      "Dangerous levels of confidence detected.",
      "Bold statement. Screenshot taken.",
      "Sources describe the confidence as 'alarming'.",
      "This will age well. Probably not.",
      "Someone is very sure of themselves tonight.",
      "Filed under: things people say before it goes wrong.",
      ({ country }) => `${country} supporter radiating unearned confidence. Classic.`,
    ],
    sierd: [
      "Confidence level noted.",
      "This is a statistically optimistic projection.",
      "Prediction registered. Outcome still pending.",
      "Assessment stored. Verification scheduled for later.",
    ],
    fabrizio: [
      "THE ENERGY IS REAL! I LOVE IT! 🔥",
      "THIS is the spirit we needed! HERE WE GO! 🚨",
      "BELIEVE AND IT HAPPENS! ⚡",
      "MAXIMUM CONFIDENCE! This is what football is about! 🔥",
      ({ flag }) => `${flag} ENERGY THROUGH THE ROOF RIGHT NOW! 🚨`,
    ],
  },
  doubt: {
    jeroen: [
      "Finally, some realism.",
      "The honesty is refreshing actually.",
      "Nervousness confirmed. As expected.",
      "This is the correct energy for this situation.",
      "At least someone is being honest.",
    ],
    sierd: [
      "Uncertainty acknowledged.",
      "The concern appears statistically valid.",
      "Nervous energy logged.",
      "Doubt registered. This is within normal parameters.",
    ],
    fabrizio: [
      "STAY STRONG! The belief HAS to be there! 🚨",
      "No doubts allowed! This is tournament football! 🔥",
      "CHIN UP! Every match can go either way! ⚡",
      "THE FAITH CANNOT WAVER! HERE WE GO! 🚨",
    ],
  },
  trash_talk: {
    jeroen: [
      "There it is.",
      "Strong words. Let's see if the pitch agrees.",
      "Respectfully delivered. Barely.",
      "Sources describe this take as 'spicy'.",
      ({ country }) => `${country} supporter starting the psychological warfare early.`,
    ],
    sierd: [
      "Opinion submitted.",
      "Assessment noted. Evidence pending.",
      "Take registered. Outcome will clarify.",
    ],
    fabrizio: [
      "THE RIVALRY IS REAL! I can feel this energy! 🔥",
      "BOLD STATEMENT from this corner of the fanbase! 🚨",
      "Football Twitter is going to LOVE this one! ⚡",
    ],
  },
  celebration: {
    jeroen: [
      "Calm.",
      "Sources describe this reaction as 'warranted, barely'.",
      "Fine. This one was deserved.",
      "Even I have to admit: yes.",
      "Acceptable.",
    ],
    sierd: [
      "Positive outcome confirmed.",
      "Celebration appears appropriate given the context.",
      "Results consistent with optimism.",
      "This is a good development. Statistically.",
    ],
    fabrizio: [
      "INCREDIBLE! JUST INCREDIBLE! 🚨",
      "HERE WE GO! THE MOMENT IS REAL! 🔥",
      "THIS IS WHY WE WATCH FOOTBALL! ⚡",
      "SCENES! ABSOLUTE SCENES! 🚨",
      "THE EMOTION! THE PASSION! I LOVE IT! 🔥",
    ],
  },
  cryptic: {
    jeroen: [
      "Noted.",
      "...okay.",
      "A message has been received.",
      "Sources describe this post as 'intentionally brief'.",
      "I'm choosing to interpret this as confidence.",
      "A lot said with very few words.",
    ],
    sierd: [
      "Message received.",
      "Content logged. Interpretation remains unclear.",
      "Brief. Noted.",
      "Short post. Filed accordingly.",
    ],
    fabrizio: [
      "SAYING SO MUCH WITH SO LITTLE! 🔥",
      "I respect the energy! Short and POWERFUL! 🚨",
      "Short message. MASSIVE statement! ⚡",
    ],
  },
  night_chaos: {
    jeroen: [
      "It's the middle of the night and someone is posting about football. Respect.",
      "Sleep schedule: cancelled. Priorities: correct.",
      "The commitment at this hour is frankly alarming.",
      "Sources describe the behavior as 'extremely normal for a World Cup supporter'.",
      "Insomnia doing numbers tonight.",
    ],
    sierd: [
      "This content was submitted outside normal waking hours.",
      "Sleep data compromised. Post submitted anyway.",
      "Late-night engagement confirmed. Within expected parameters.",
      "Unusual posting hour noted without judgment.",
    ],
    fabrizio: [
      "UP AT THIS HOUR FOR FOOTBALL! The dedication is UNREAL! 🌙",
      "LATE NIGHT ENERGY! This is what passion looks like! 🔥",
      "No sleep during a World Cup! THIS is commitment! ⚡",
      "THE NIGHT SHIFT IS ACTIVE! HERE WE GO! 🚨",
    ],
  },
  derby: {
    jeroen: [
      "The derby build-up starts early. As always.",
      "Tensions rising. 24 hours to go.",
      "Sources confirm: everyone is already too invested in this.",
      "Derby energy arriving ahead of schedule.",
      "This group chat is about to get chaotic.",
    ],
    sierd: [
      "Derby countdown ongoing.",
      "Match proximity confirmed. Atmosphere elevated.",
      "Pre-derby behavior consistent with historical patterns.",
      "Tension levels rising. This is expected.",
    ],
    fabrizio: [
      "DERBY DAY APPROACHES! The anticipation is ELECTRIC! 🚨",
      "FEEL THE ENERGY! THE RIVALRY IS BUILDING! 🔥",
      "24 HOURS UNTIL THE DERBY! HERE WE GO! ⚡",
      "THE BIGGEST MATCH OF THE GROUP STAGE IS ALMOST HERE! 🚨",
    ],
  },
  neutral: {
    jeroen: [
      "Supporter activity confirmed.",
      "Another post enters the feed.",
      "The group chat energy translated to content. Interesting.",
      "Sources describe this as 'happening'.",
      ({ country }) => `${country} supporters: present and accounted for.`,
    ],
    sierd: [
      "Post noted.",
      "Content received.",
      "This is consistent with supporter behavior.",
      "Entry logged.",
    ],
    fabrizio: [
      "THE ENERGY IN THIS COMMUNITY! 🔥",
      "LOVE seeing the supporters ACTIVE! 🚨",
      "This is what it's ALL ABOUT! ⚡",
      ({ flag, country }) => `${flag} ${country} SHOWING UP! I love this! 🔥`,
    ],
  },
};

function evalTemplate(
  tpl: CommentTemplate,
  ctx: { country?: string; flag?: string }
): string {
  return typeof tpl === "function" ? tpl(ctx) : tpl;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateCommentatorComment(
  commentatorId: CommentatorId,
  tone: ToneCategory,
  ctx: { country?: string; flag?: string }
): string {
  const bucket = COMMENT_TEMPLATES[tone][commentatorId];
  return evalTemplate(pick(bucket), ctx);
}

// ─── Standalone feed post templates (unchanged from before) ───────────────────

export type EventType =
  | "post_activity"
  | "night_post"
  | "high_country_activity"
  | "quiet_atmosphere"
  | "vote_spike"
  | "general_atmosphere";

type StandaloneTemplate = (ctx: { country?: string; flag?: string; count?: number }) => string;

const TEMPLATES: Record<EventType, Record<CommentatorId, StandaloneTemplate[]>> = {
  post_activity: {
    jeroen: [
      ({ flag, country }) => `${flag} ${country} supporters confirming they are still alive`,
      ({ flag, country }) => `📸 Another ${country} post. Whether this changes anything remains to be seen. ${flag}`,
      ({ flag, country }) => `${flag} ${country} checking in. Barely.`,
      ({ flag, country }) => `${flag} ${country} posting content as if anyone asked`,
      ({ flag, country }) => `${flag} ${country} supporters taking this way too seriously tonight`,
      ({ flag, country }) => `📸 ${country} supporter active in the feed.\n\nCelebration or damage control — unclear. ${flag}`,
    ],
    sierd: [
      ({ flag, country }) => `📸 ${country} has submitted a new post.\n\nThis is a factually accurate statement. ${flag}`,
      ({ flag, country }) => `${flag} A ${country} supporter has uploaded media content.\n\nThe data has been received.`,
      ({ flag, country }) => `📊 Post submitted by a ${country} supporter.\n\nTimestamp logged. ${flag}`,
      ({ flag, country }) => `${flag} ${country} supporter activity is ongoing.\n\nThis is consistent with observed patterns.`,
    ],
    fabrizio: [
      ({ flag, country }) => `🔥 ${flag} ${country} supporters ACTIVE in the feed right now!`,
      ({ flag, country }) => `🚨 ${flag} ${country} content just dropped — and it is EXACTLY what we needed!`,
      ({ flag, country }) => `📸 ${flag} ${country} showing UP tonight — HERE WE GO!`,
      ({ flag, country }) => `⚡ ${flag} ${country} momentum building RIGHT NOW!`,
    ],
  },
  night_post: {
    jeroen: [
      ({ flag, country }) => `🌙 ${flag} ${country} supporters reportedly still awake.\n\nNo further comment.`,
      ({ flag, country }) => `😴 ${flag} ${country} supporter active at this hour.\n\nSleep schedules: cancelled.`,
      ({ flag, country }) => `🌙 ${flag} ${country} supporter refusing to let tonight end.\n\nSources describe the situation as "inevitable".`,
      ({ country }) => `🌙 Late-night ${country} supporter activity detected.\n\n📵 Family members reportedly going unanswered.`,
    ],
    sierd: [
      ({ flag, country }) => `🕐 This post was created outside normal waking hours.\n\n${flag} ${country} supporter activity confirmed.`,
      ({ flag, country }) => `🌙 A ${country} supporter has submitted content at an unusual time.\n\nSleep statistics may be affected. ${flag}`,
      ({ country }) => `📊 ${country} post registered during late-night window.\n\nThis is within the expected range of supporter behavior.`,
    ],
    fabrizio: [
      ({ flag, country }) => `🌙 ${flag} ${country} supporters REFUSING to sleep! The passion is ABSOLUTELY REAL tonight!`,
      ({ flag, country }) => `🔥 LATE NIGHT ENERGY from the ${flag} ${country} camp! This is what DEDICATION looks like!`,
      ({ flag, country }) => `⚡ ${flag} ${country} still going at this hour! Unbelievable commitment from these fans!`,
    ],
  },
  high_country_activity: {
    jeroen: [
      ({ flag, country }) => `📈 ${flag} ${country} really going for it tonight.\n\nRelax.`,
      ({ flag, country }) => `${flag} ${country} supporters taking over the feed. Uninvited.`,
      ({ flag, country }) => `${flag} ${country} supporters posting aggressively tonight.\n\nSources describe morale as "suspicious".`,
      ({ flag, country, count }) => `📸 ${count} ${country} posts in rapid succession.\n\n${flag} Something has clearly happened.`,
    ],
    sierd: [
      ({ flag, country }) => `📊 ${flag} ${country} has posted multiple times within a short window.\n\nActivity levels are elevated.`,
      ({ flag, country, count }) => `${flag} ${country} supporters have submitted ${count} posts recently.\n\nThe data suggests momentum.`,
      ({ flag, country }) => `📈 ${country} posting frequency has increased.\n\nThis is statistically notable. ${flag}`,
    ],
    fabrizio: [
      ({ flag, country }) => `🚨 ${flag} ${country} DOMINATING the feed right now! UNREAL energy from these supporters!`,
      ({ flag, country }) => `📈 ${flag} ${country} supporter momentum BUILDING FAST tonight — everyone can feel it!`,
      ({ flag, country }) => `⚡ ${flag} ${country} fans are ON FIRE right now! The feed cannot contain them!`,
      ({ flag, country }) => `🔥 HERE WE GO — ${flag} ${country} taking OVER tonight! MASSIVE supporter energy!`,
    ],
  },
  quiet_atmosphere: {
    jeroen: [
      () => `🪑 At least one supporter reportedly stood on furniture this evening\n\nSources: reliable`,
      () => `🍻 Fluid intake among active supporters described as "above average" tonight`,
      () => `📵 Multiple supporters reportedly ignoring messages from concerned family members`,
      () => `🚓 Security presence near fan zones reportedly increasing tonight`,
      () => `🌙 Sleep schedules collapsing across multiple fanbases\n\nSources: expected`,
      () => `🗳️ Several supporter groups refusing comment after tonight's activity`,
      () => `🔥 Derby tensions escalating across multiple fan groups\n\nAs expected.`,
      () => `📱 Group chats across all fanbases currently in chaos\n\nSources: obvious`,
      () => `😈 Supporters acting like they predicted everything\n\nAs usual.`,
    ],
    sierd: [
      () => `🛋️ Several supporters appear to be watching from home.\n\nThis is also a valid choice.`,
      () => `😐 Atmosphere described as "intense" by at least one observer.\n\nThis assessment is pending verification.`,
      () => `📊 Current engagement data suggests activity is ongoing.\n\nNo further elaboration is necessary.`,
      () => `🪑 Seating arrangements among supporter groups appear informal.\n\nThis is within normal parameters.`,
      () => `📡 Feed monitoring ongoing.\n\nNo anomalies detected at this time. Probably.`,
      () => `🕐 Time continues to pass.\n\nSupporter behavior remains consistent with itself.`,
    ],
    fabrizio: [
      () => `🔥 The atmosphere across the entire supporter network is INCREDIBLE right now!`,
      () => `⚡ Energy levels are through the ROOF tonight — you can absolutely feel it!`,
      () => `🌍 This is what a GLOBAL supporter event looks like — and EVERYONE is feeling it!`,
      () => `🚨 Something big is building across fanbases tonight — stay LOCKED IN!`,
    ],
  },
  vote_spike: {
    jeroen: [
      () => `🗳️ Significant voting activity detected.\n\nSupporter desperation levels rising.`,
      () => `🗳️ Voting numbers up.\n\nThis will mean nothing by tomorrow.`,
      () => `📊 Supporter groups not trusting the process.\n\n🗳️ And yet, voting anyway.`,
    ],
    sierd: [
      () => `🗳️ Voting participation has increased.\n\nThis is statistically notable.`,
      () => `📊 Voting activity has risen by a measurable amount.\n\nThe data is being observed.`,
      () => `🗳️ Multiple votes registered in the current window.\n\nThis is consistent with engagement behavior.`,
    ],
    fabrizio: [
      () => `🚨 VOTING ACTIVITY EXPLODING right now! The competition is absolutely ON!`,
      () => `⚡ The vote count is SURGING! Every supporter is making their voice heard!`,
      () => `🗳️ Massive voting participation confirmed! This is a STATEMENT!`,
    ],
  },
  general_atmosphere: {
    jeroen: [
      () => `📉 One fanbase currently pretending tonight never happened`,
      () => `🔥 Rivalry energy building across the feed\n\nSomebody is going to say something.`,
      () => `😈 Supporters acting like they predicted everything\n\nAs usual.`,
    ],
    sierd: [
      () => `📊 Overall supporter activity is within normal parameters.\n\nThank you for your attention.`,
      () => `📡 Feed monitoring ongoing.\n\nNo anomalies detected at this time.`,
    ],
    fabrizio: [
      () => `🌍 MASSIVE supporter energy building across ALL fanbases tonight!`,
      () => `⚡ The competition is HEATING UP and the fans are absolutely LOVING it!`,
      () => `🚨 Something special is happening in this supporter community right now!`,
    ],
  },
};

export function pickCommentator(exclude?: CommentatorId): CommentatorId {
  const all: CommentatorId[] = ["jeroen", "sierd", "fabrizio"];
  const options = exclude ? all.filter((c) => c !== exclude) : all;
  return pick(options);
}

export interface CommentaryContext {
  triggeredBy: "post" | "vote" | "comment" | "manual" | "atmosphere";
  country?: string;
  flag?: string;
  count?: number;
  isNight?: boolean;
  isHighActivity?: boolean;
  lastCommentatorId?: CommentatorId;
}

export function generateCommentary(ctx: CommentaryContext): {
  commentatorId: CommentatorId;
  message: string;
  eventType: EventType;
} {
  const commentatorId = pickCommentator(ctx.lastCommentatorId);

  let eventType: EventType;
  if (ctx.triggeredBy === "vote") {
    eventType = "vote_spike";
  } else if (ctx.isNight) {
    eventType = "night_post";
  } else if (ctx.isHighActivity) {
    eventType = "high_country_activity";
  } else if (ctx.triggeredBy === "post") {
    const roll = Math.random();
    if (roll < 0.55) eventType = "post_activity";
    else if (roll < 0.75) eventType = "quiet_atmosphere";
    else eventType = "general_atmosphere";
  } else {
    eventType = pick(["quiet_atmosphere", "general_atmosphere"] as EventType[]);
  }

  const templates = TEMPLATES[eventType][commentatorId];
  const template = pick(templates);
  const message = template({ country: ctx.country, flag: ctx.flag, count: ctx.count });

  return { commentatorId, message, eventType };
}
