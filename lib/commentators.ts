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

export type EventType =
  | "post_activity"
  | "night_post"
  | "high_country_activity"
  | "quiet_atmosphere"
  | "vote_spike"
  | "general_atmosphere";

type TemplateCtx = {
  country?: string;
  flag?: string;
  count?: number;
};

type Template = (ctx: TemplateCtx) => string;

const TEMPLATES: Record<EventType, Record<CommentatorId, Template[]>> = {
  post_activity: {
    jeroen: [
      ({ flag, country }) =>
        `${flag} ${country} supporters confirming they are still alive`,
      ({ flag, country }) =>
        `📸 Another ${country} post. Whether this changes anything remains to be seen. ${flag}`,
      ({ flag, country }) => `${flag} ${country} checking in. Barely.`,
      ({ flag, country }) =>
        `${flag} ${country} posting content as if anyone asked`,
      ({ flag, country }) =>
        `${flag} ${country} supporters taking this way too seriously tonight`,
      ({ flag, country }) =>
        `📸 ${country} supporter active in the feed.\n\nCelebration or damage control — unclear. ${flag}`,
    ],
    sierd: [
      ({ flag, country }) =>
        `📸 ${country} has submitted a new post.\n\nThis is a factually accurate statement. ${flag}`,
      ({ flag, country }) =>
        `${flag} A ${country} supporter has uploaded media content.\n\nThe data has been received.`,
      ({ flag, country }) =>
        `📊 Post submitted by a ${country} supporter.\n\nTimestamp logged. ${flag}`,
      ({ flag, country }) =>
        `${flag} ${country} supporter activity is ongoing.\n\nThis is consistent with observed patterns.`,
    ],
    fabrizio: [
      ({ flag, country }) =>
        `🔥 ${flag} ${country} supporters ACTIVE in the feed right now!`,
      ({ flag, country }) =>
        `🚨 ${flag} ${country} content just dropped — and it is EXACTLY what we needed!`,
      ({ flag, country }) =>
        `📸 ${flag} ${country} showing UP tonight — HERE WE GO!`,
      ({ flag, country }) =>
        `⚡ ${flag} ${country} momentum building RIGHT NOW!`,
    ],
  },

  night_post: {
    jeroen: [
      ({ flag, country }) =>
        `🌙 ${flag} ${country} supporters reportedly still awake.\n\nNo further comment.`,
      ({ flag, country }) =>
        `😴 ${flag} ${country} supporter active at this hour.\n\nSleep schedules: cancelled.`,
      ({ flag, country }) =>
        `🌙 ${flag} ${country} supporter refusing to let tonight end.\n\nSources describe the situation as "inevitable".`,
      ({ country }) =>
        `🌙 Late-night ${country} supporter activity detected.\n\n📵 Family members reportedly going unanswered.`,
    ],
    sierd: [
      ({ flag, country }) =>
        `🕐 This post was created outside normal waking hours.\n\n${flag} ${country} supporter activity confirmed.`,
      ({ flag, country }) =>
        `🌙 A ${country} supporter has submitted content at an unusual time.\n\nSleep statistics may be affected. ${flag}`,
      ({ country }) =>
        `📊 ${country} post registered during late-night window.\n\nThis is within the expected range of supporter behavior.`,
    ],
    fabrizio: [
      ({ flag, country }) =>
        `🌙 ${flag} ${country} supporters REFUSING to sleep! The passion is ABSOLUTELY REAL tonight!`,
      ({ flag, country }) =>
        `🔥 LATE NIGHT ENERGY from the ${flag} ${country} camp! This is what DEDICATION looks like!`,
      ({ flag, country }) =>
        `⚡ ${flag} ${country} still going at this hour! Unbelievable commitment from these fans!`,
    ],
  },

  high_country_activity: {
    jeroen: [
      ({ flag, country }) =>
        `📈 ${flag} ${country} really going for it tonight.\n\nRelax.`,
      ({ flag, country }) =>
        `${flag} ${country} supporters taking over the feed. Uninvited.`,
      ({ flag, country }) =>
        `${flag} ${country} supporters posting aggressively tonight.\n\nSources describe morale as "suspicious".`,
      ({ flag, country, count }) =>
        `📸 ${count} ${country} posts in rapid succession.\n\n${flag} Something has clearly happened.`,
    ],
    sierd: [
      ({ flag, country }) =>
        `📊 ${flag} ${country} has posted multiple times within a short window.\n\nActivity levels are elevated.`,
      ({ flag, country, count }) =>
        `${flag} ${country} supporters have submitted ${count} posts recently.\n\nThe data suggests momentum.`,
      ({ flag, country }) =>
        `📈 ${country} posting frequency has increased.\n\nThis is statistically notable. ${flag}`,
    ],
    fabrizio: [
      ({ flag, country }) =>
        `🚨 ${flag} ${country} DOMINATING the feed right now! UNREAL energy from these supporters!`,
      ({ flag, country }) =>
        `📈 ${flag} ${country} supporter momentum BUILDING FAST tonight — everyone can feel it!`,
      ({ flag, country }) =>
        `⚡ ${flag} ${country} fans are ON FIRE right now! The feed cannot contain them!`,
      ({ flag, country }) =>
        `🔥 HERE WE GO — ${flag} ${country} taking OVER tonight! MASSIVE supporter energy!`,
    ],
  },

  quiet_atmosphere: {
    jeroen: [
      () =>
        `🪑 At least one supporter reportedly stood on furniture this evening\n\nSources: reliable`,
      () =>
        `🍻 Fluid intake among active supporters described as "above average" tonight`,
      () =>
        `📵 Multiple supporters reportedly ignoring messages from concerned family members`,
      () => `🚓 Security presence near fan zones reportedly increasing tonight`,
      () =>
        `🌙 Sleep schedules collapsing across multiple fanbases\n\nSources: expected`,
      () =>
        `🗳️ Several supporter groups refusing comment after tonight's activity`,
      () =>
        `🔥 Derby tensions escalating across multiple fan groups\n\nAs expected.`,
      () =>
        `📱 Group chats across all fanbases currently in chaos\n\nSources: obvious`,
      () =>
        `😈 Supporters acting like they predicted everything\n\nAs usual.`,
    ],
    sierd: [
      () =>
        `🛋️ Several supporters appear to be watching from home.\n\nThis is also a valid choice.`,
      () =>
        `😐 Atmosphere described as "intense" by at least one observer.\n\nThis assessment is pending verification.`,
      () =>
        `📊 Current engagement data suggests activity is ongoing.\n\nNo further elaboration is necessary.`,
      () =>
        `🪑 Seating arrangements among supporter groups appear informal.\n\nThis is within normal parameters.`,
      () =>
        `📡 Feed monitoring ongoing.\n\nNo anomalies detected at this time. Probably.`,
      () =>
        `🕐 Time continues to pass.\n\nSupporter behavior remains consistent with itself.`,
    ],
    fabrizio: [
      () =>
        `🔥 The atmosphere across the entire supporter network is INCREDIBLE right now!`,
      () =>
        `⚡ Energy levels are through the ROOF tonight — you can absolutely feel it!`,
      () =>
        `🌍 This is what a GLOBAL supporter event looks like — and EVERYONE is feeling it!`,
      () =>
        `🚨 Something big is building across fanbases tonight — stay LOCKED IN!`,
    ],
  },

  vote_spike: {
    jeroen: [
      () =>
        `🗳️ Significant voting activity detected.\n\nSupporter desperation levels rising.`,
      () => `🗳️ Voting numbers up.\n\nThis will mean nothing by tomorrow.`,
      () =>
        `📊 Supporter groups not trusting the process.\n\n🗳️ And yet, voting anyway.`,
    ],
    sierd: [
      () =>
        `🗳️ Voting participation has increased.\n\nThis is statistically notable.`,
      () =>
        `📊 Voting activity has risen by a measurable amount.\n\nThe data is being observed.`,
      () =>
        `🗳️ Multiple votes registered in the current window.\n\nThis is consistent with engagement behavior.`,
    ],
    fabrizio: [
      () =>
        `🚨 VOTING ACTIVITY EXPLODING right now! The competition is absolutely ON!`,
      () =>
        `⚡ The vote count is SURGING! Every supporter is making their voice heard!`,
      () => `🗳️ Massive voting participation confirmed! This is a STATEMENT!`,
    ],
  },

  general_atmosphere: {
    jeroen: [
      () => `📉 One fanbase currently pretending tonight never happened`,
      () => `🔥 Rivalry energy building across the feed\n\nSomebody is going to say something.`,
      () =>
        `😈 Supporters acting like they predicted everything\n\nAs usual.`,
    ],
    sierd: [
      () =>
        `📊 Overall supporter activity is within normal parameters.\n\nThank you for your attention.`,
      () =>
        `📡 Feed monitoring ongoing.\n\nNo anomalies detected at this time.`,
    ],
    fabrizio: [
      () =>
        `🌍 MASSIVE supporter energy building across ALL fanbases tonight!`,
      () =>
        `⚡ The competition is HEATING UP and the fans are absolutely LOVING it!`,
      () =>
        `🚨 Something special is happening in this supporter community right now!`,
    ],
  },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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
  const message = template({
    country: ctx.country,
    flag: ctx.flag,
    count: ctx.count,
  });

  return { commentatorId, message, eventType };
}
