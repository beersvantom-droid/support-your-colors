export interface Supporter {
  id: number;
  name: string;
  username: string;
  country: string;
  flag: string;
  color: string;
  supporter_points: number;
  streak: number;
  initials: string;
  rank: number;
}

export interface FeedPost {
  id: number;
  supporter: Supporter;
  time: string;
  caption: string;
  imageColors: [string, string];
  fires: number;
  laughs: number;
  comments: number;
  topComment: { name: string; text: string };
}

export interface TrendingItem {
  emoji: string;
  label: string;
  color: string;
}

export const supporters: Supporter[] = [
  { id: 1, name: "Marco",  username: "@marco_seleção",  country: "Brazil",      flag: "🇧🇷", color: "#009C3B", supporter_points: 2840, streak: 5, initials: "MA", rank: 1  },
  { id: 2, name: "Tyler",  username: "@tyler_usa",      country: "USA",         flag: "🇺🇸", color: "#1A3A6E", supporter_points: 2650, streak: 3, initials: "TY", rank: 2  },
  { id: 3, name: "Emma",   username: "@emma_canada",    country: "Canada",      flag: "🇨🇦", color: "#D52B1E", supporter_points: 2410, streak: 7, initials: "EM", rank: 3  },
  { id: 4, name: "Diego",  username: "@diego_mx",       country: "Mexico",      flag: "🇲🇽", color: "#006847", supporter_points: 2180, streak: 2, initials: "DI", rank: 4  },
  { id: 5, name: "Sofia",  username: "@sofia_campeona", country: "Argentina",   flag: "🇦🇷", color: "#4A90D9", supporter_points: 2050, streak: 0, initials: "SO", rank: 5  },
  { id: 6, name: "Sven",   username: "@sven_de",        country: "Germany",     flag: "🇩🇪", color: "#DD0000", supporter_points: 1980, streak: 1, initials: "SV", rank: 6  },
  { id: 7, name: "James",  username: "@james_eng",      country: "England",     flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#CF091C", supporter_points: 1820, streak: 0, initials: "JA", rank: 7  },
  { id: 8, name: "Luís",   username: "@luis_portugal",  country: "Portugal",    flag: "🇵🇹", color: "#006600", supporter_points: 1760, streak: 4, initials: "LU", rank: 8  },
  { id: 9, name: "Yuki",   username: "@yuki_japan",     country: "Japan",       flag: "🇯🇵", color: "#BC002D", supporter_points: 1690, streak: 2, initials: "YU", rank: 9  },
  { id: 10, name: "Ahmed", username: "@ahmed_morocco",  country: "Morocco",     flag: "🇲🇦", color: "#C1272D", supporter_points: 1540, streak: 1, initials: "AH", rank: 10 },
  { id: 11, name: "Pieter",username: "@pieter_nl",      country: "Netherlands", flag: "🇳🇱", color: "#FF6600", supporter_points: 1420, streak: 0, initials: "PI", rank: 11 },
  { id: 12, name: "Chris", username: "@chris_france",   country: "France",      flag: "🇫🇷", color: "#002395", supporter_points: 1380, streak: 3, initials: "CH", rank: 12 },
  { id: 13, name: "Luca",  username: "@luca_azzurri",   country: "Italy",       flag: "🇮🇹", color: "#009246", supporter_points: 1210, streak: 0, initials: "LC", rank: 13 },
];

export const feedPosts: FeedPost[] = [
  {
    id: 1,
    supporter: supporters[0],
    time: "2m ago",
    caption: "Believe. 🇧🇷🔥 Nobody stopping the Seleção in 2026. Book it. I said what I said.",
    imageColors: ["#009C3B", "#065a2a"],
    fires: 11,
    laughs: 3,
    comments: 4,
    topComment: { name: "Tyler", text: "Keep dreaming lol 🇺🇸😭" },
  },
  {
    id: 2,
    supporter: supporters[1],
    time: "14m ago",
    caption: "HOME SOIL ADVANTAGE HITS DIFFERENT 🏠🇺🇸 We're literally built for this moment. NYC, LA, Dallas — we run this.",
    imageColors: ["#1A3A6E", "#0d1f3c"],
    fires: 8,
    laughs: 5,
    comments: 7,
    topComment: { name: "Emma", text: "Canada also hosts btw 👀🍁 don't get too comfortable" },
  },
  {
    id: 3,
    supporter: supporters[2],
    time: "1h ago",
    caption: "Y'all better start respecting Canada 😤🍁 We're hosting AND competing. This is NOT a drill.",
    imageColors: ["#D52B1E", "#7a1810"],
    fires: 13,
    laughs: 6,
    comments: 9,
    topComment: { name: "Diego", text: "🇲🇽 also co-hosting... but ok sure 😂😂" },
  },
  {
    id: 4,
    supporter: supporters[4],
    time: "3h ago",
    caption: "Defending champions don't panic. We stay quiet until July. Then we remind everyone. 🤫🇦🇷",
    imageColors: ["#4A90D9", "#1a4a7a"],
    fires: 9,
    laughs: 2,
    comments: 11,
    topComment: { name: "Sven", text: "Germany says hello 🇩🇪 rest well" },
  },
  {
    id: 5,
    supporter: supporters[3],
    time: "5h ago",
    caption: "Everyone counting Mexico out. That's fine. We been here before 😌🇲🇽🔥",
    imageColors: ["#006847", "#003d2b"],
    fires: 15,
    laughs: 4,
    comments: 6,
    topComment: { name: "Marco", text: "Group stage is the farthest you're going bro 💀" },
  },
];

export const trendingItems: TrendingItem[] = [
  { emoji: "🔥", label: "Brazil on fire",        color: "#009C3B" },
  { emoji: "🆙", label: "Canada climbing fast",  color: "#D52B1E" },
  { emoji: "😤", label: "Argentina locked in",   color: "#4A90D9" },
  { emoji: "💀", label: "England sweating",       color: "#CF091C" },
  { emoji: "🏠", label: "USA hosting energy",    color: "#1A3A6E" },
  { emoji: "🐉", label: "Mexico rising again",   color: "#006847" },
];
