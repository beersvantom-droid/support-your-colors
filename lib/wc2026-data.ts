// ─── WC 2026 Team Registry ────────────────────────────────────────────────────

export interface TeamInfo {
  flag: string;
  color: string; // primary brand color
  abbr: string;  // 3-letter abbreviation
}

export const TEAMS: Record<string, TeamInfo> = {
  // Group A
  "Mexico":              { flag: "🇲🇽", color: "#006847", abbr: "MEX" },
  "South Africa":        { flag: "🇿🇦", color: "#007A4D", abbr: "RSA" },
  "South Korea":         { flag: "🇰🇷", color: "#003478", abbr: "KOR" },
  "Czechia":             { flag: "🇨🇿", color: "#D7141A", abbr: "CZE" },
  // Group B
  "Canada":              { flag: "🇨🇦", color: "#D52B1E", abbr: "CAN" },
  "Bosnia and Herzegovina": { flag: "🇧🇦", color: "#002B8F", abbr: "BIH" },
  "Qatar":               { flag: "🇶🇦", color: "#8D1B3D", abbr: "QAT" },
  "Switzerland":         { flag: "🇨🇭", color: "#FF0000", abbr: "SUI" },
  // Group C
  "Brazil":              { flag: "🇧🇷", color: "#009C3B", abbr: "BRA" },
  "Morocco":             { flag: "🇲🇦", color: "#C1272D", abbr: "MAR" },
  "Haiti":               { flag: "🇭🇹", color: "#00209F", abbr: "HAI" },
  "Scotland":            { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", color: "#003F87", abbr: "SCO" },
  // Group D
  "United States":       { flag: "🇺🇸", color: "#002868", abbr: "USA" },
  "Paraguay":            { flag: "🇵🇾", color: "#D52B1E", abbr: "PAR" },
  "Australia":           { flag: "🇦🇺", color: "#002B7F", abbr: "AUS" },
  "Türkiye":             { flag: "🇹🇷", color: "#E30A17", abbr: "TUR" },
  // Group E
  "Germany":             { flag: "🇩🇪", color: "#DD0000", abbr: "GER" },
  "Curaçao":             { flag: "🇨🇼", color: "#003082", abbr: "CUW" },
  "Ivory Coast":         { flag: "🇨🇮", color: "#F77F00", abbr: "CIV" },
  "Ecuador":             { flag: "🇪🇨", color: "#FFD100", abbr: "ECU" },
  // Group F
  "Netherlands":         { flag: "🇳🇱", color: "#FF6600", abbr: "NED" },
  "Japan":               { flag: "🇯🇵", color: "#BC002D", abbr: "JPN" },
  "Sweden":              { flag: "🇸🇪", color: "#006AA7", abbr: "SWE" },
  "Tunisia":             { flag: "🇹🇳", color: "#E70013", abbr: "TUN" },
  // Group G
  "Belgium":             { flag: "🇧🇪", color: "#EF3340", abbr: "BEL" },
  "Egypt":               { flag: "🇪🇬", color: "#CE1126", abbr: "EGY" },
  "Iran":                { flag: "🇮🇷", color: "#239F40", abbr: "IRN" },
  "New Zealand":         { flag: "🇳🇿", color: "#00247D", abbr: "NZL" },
  // Group H
  "Spain":               { flag: "🇪🇸", color: "#AA151B", abbr: "ESP" },
  "Cape Verde":          { flag: "🇨🇻", color: "#003893", abbr: "CPV" },
  "Saudi Arabia":        { flag: "🇸🇦", color: "#006C35", abbr: "KSA" },
  "Uruguay":             { flag: "🇺🇾", color: "#5EB6E4", abbr: "URU" },
  // Group I
  "France":              { flag: "🇫🇷", color: "#002395", abbr: "FRA" },
  "Senegal":             { flag: "🇸🇳", color: "#00853F", abbr: "SEN" },
  "Iraq":                { flag: "🇮🇶", color: "#007A3D", abbr: "IRQ" },
  "Norway":              { flag: "🇳🇴", color: "#EF2B2D", abbr: "NOR" },
  // Group J
  "Argentina":           { flag: "🇦🇷", color: "#74ACDF", abbr: "ARG" },
  "Algeria":             { flag: "🇩🇿", color: "#006233", abbr: "ALG" },
  "Austria":             { flag: "🇦🇹", color: "#ED2939", abbr: "AUT" },
  "Jordan":              { flag: "🇯🇴", color: "#007A3D", abbr: "JOR" },
  // Group K
  "Portugal":            { flag: "🇵🇹", color: "#006600", abbr: "POR" },
  "Congo DR":            { flag: "🇨🇩", color: "#007FFF", abbr: "COD" },
  "Uzbekistan":          { flag: "🇺🇿", color: "#1EB53A", abbr: "UZB" },
  "Colombia":            { flag: "🇨🇴", color: "#FCD116", abbr: "COL" },
  // Group L
  "England":             { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#CF091C", abbr: "ENG" },
  "Croatia":             { flag: "🇭🇷", color: "#EE1520", abbr: "CRO" },
  "Ghana":               { flag: "🇬🇭", color: "#006B3F", abbr: "GHA" },
  "Panama":              { flag: "🇵🇦", color: "#DB0000", abbr: "PAN" },
};

// ─── Supporter Mappings ───────────────────────────────────────────────────────

export interface Supporter {
  name: string;
  isCurrentUser?: boolean;
}

export const SUPPORTERS: Record<string, Supporter> = {
  "Canada":                 { name: "Jij", isCurrentUser: true },
  "Qatar":                  { name: "Albert" },
  "Bosnia and Herzegovina": { name: "Tuur" },
  "Switzerland":            { name: "Sep" },
  "Germany":                { name: "Michiel" },
  "Curaçao":                { name: "Tobias" },
  "Iraq":                   { name: "Jochem" },
  "Ecuador":                { name: "Willem" },
  "Tunisia":                { name: "Kas" },
};

// ─── Fixture & Group Types ────────────────────────────────────────────────────

export type MatchStatus = "upcoming" | "live" | "finished";

export interface WCFixture {
  matchday: number;
  date: string;       // e.g. "Jun 12"
  time: string;       // e.g. "3:00 PM ET"
  home: string;       // team key from TEAMS
  away: string;       // team key from TEAMS
  venue: string;
  city: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
}

export interface WCGroup {
  id: string;         // "A" – "L"
  teams: string[];    // ordered by current standing (initially draw order)
  fixtures: WCFixture[];
}

// ─── Group Stage Data ─────────────────────────────────────────────────────────

export const GROUPS: WCGroup[] = [
  // ── GROUP A ──────────────────────────────────────────────────────────────
  {
    id: "A",
    teams: ["Mexico", "South Africa", "South Korea", "Czechia"],
    fixtures: [
      {
        matchday: 1, date: "Jun 11", time: "3:00 PM ET",
        home: "Mexico", away: "South Africa",
        venue: "Estadio Azteca", city: "Mexico City", status: "upcoming",
      },
      {
        matchday: 1, date: "Jun 11", time: "10:00 PM ET",
        home: "South Korea", away: "Czechia",
        venue: "Estadio Akron", city: "Guadalajara", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 18", time: "12:00 PM ET",
        home: "Czechia", away: "South Africa",
        venue: "Mercedes-Benz Stadium", city: "Atlanta", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 18", time: "9:00 PM ET",
        home: "Mexico", away: "South Korea",
        venue: "Estadio Akron", city: "Guadalajara", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 24", time: "9:00 PM ET",
        home: "Czechia", away: "Mexico",
        venue: "Estadio Azteca", city: "Mexico City", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 24", time: "9:00 PM ET",
        home: "South Africa", away: "South Korea",
        venue: "Estadio BBVA", city: "Monterrey", status: "upcoming",
      },
    ],
  },

  // ── GROUP B ──────────────────────────────────────────────────────────────
  {
    id: "B",
    teams: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
    fixtures: [
      {
        matchday: 1, date: "Jun 12", time: "3:00 PM ET",
        home: "Canada", away: "Bosnia and Herzegovina",
        venue: "BMO Field", city: "Toronto", status: "upcoming",
      },
      {
        matchday: 1, date: "Jun 13", time: "3:00 PM ET",
        home: "Qatar", away: "Switzerland",
        venue: "Levi's Stadium", city: "Santa Clara", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 18", time: "3:00 PM ET",
        home: "Switzerland", away: "Bosnia and Herzegovina",
        venue: "SoFi Stadium", city: "Los Angeles", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 18", time: "6:00 PM ET",
        home: "Canada", away: "Qatar",
        venue: "BC Place", city: "Vancouver", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 24", time: "3:00 PM ET",
        home: "Switzerland", away: "Canada",
        venue: "BC Place", city: "Vancouver", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 24", time: "3:00 PM ET",
        home: "Bosnia and Herzegovina", away: "Qatar",
        venue: "Lumen Field", city: "Seattle", status: "upcoming",
      },
    ],
  },

  // ── GROUP C ──────────────────────────────────────────────────────────────
  {
    id: "C",
    teams: ["Brazil", "Morocco", "Haiti", "Scotland"],
    fixtures: [
      {
        matchday: 1, date: "Jun 13", time: "6:00 PM ET",
        home: "Brazil", away: "Morocco",
        venue: "MetLife Stadium", city: "East Rutherford", status: "upcoming",
      },
      {
        matchday: 1, date: "Jun 13", time: "9:00 PM ET",
        home: "Haiti", away: "Scotland",
        venue: "Gillette Stadium", city: "Foxborough", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 19", time: "6:00 PM ET",
        home: "Scotland", away: "Morocco",
        venue: "Gillette Stadium", city: "Foxborough", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 19", time: "8:30 PM ET",
        home: "Brazil", away: "Haiti",
        venue: "Lincoln Financial Field", city: "Philadelphia", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 24", time: "6:00 PM ET",
        home: "Scotland", away: "Brazil",
        venue: "Hard Rock Stadium", city: "Miami", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 24", time: "6:00 PM ET",
        home: "Morocco", away: "Haiti",
        venue: "Mercedes-Benz Stadium", city: "Atlanta", status: "upcoming",
      },
    ],
  },

  // ── GROUP D ──────────────────────────────────────────────────────────────
  {
    id: "D",
    teams: ["United States", "Paraguay", "Australia", "Türkiye"],
    fixtures: [
      {
        matchday: 1, date: "Jun 12", time: "9:00 PM ET",
        home: "United States", away: "Paraguay",
        venue: "SoFi Stadium", city: "Los Angeles", status: "upcoming",
      },
      {
        matchday: 1, date: "Jun 14", time: "12:00 AM ET",
        home: "Australia", away: "Türkiye",
        venue: "BC Place", city: "Vancouver", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 19", time: "3:00 PM ET",
        home: "United States", away: "Australia",
        venue: "Lumen Field", city: "Seattle", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 20", time: "12:00 AM ET",
        home: "Türkiye", away: "Paraguay",
        venue: "Levi's Stadium", city: "Santa Clara", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 25", time: "10:00 PM ET",
        home: "Türkiye", away: "United States",
        venue: "SoFi Stadium", city: "Los Angeles", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 25", time: "10:00 PM ET",
        home: "Paraguay", away: "Australia",
        venue: "Levi's Stadium", city: "Santa Clara", status: "upcoming",
      },
    ],
  },

  // ── GROUP E ──────────────────────────────────────────────────────────────
  {
    id: "E",
    teams: ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
    fixtures: [
      {
        matchday: 1, date: "Jun 14", time: "1:00 PM ET",
        home: "Germany", away: "Curaçao",
        venue: "NRG Stadium", city: "Houston", status: "upcoming",
      },
      {
        matchday: 1, date: "Jun 14", time: "7:00 PM ET",
        home: "Ivory Coast", away: "Ecuador",
        venue: "Lincoln Financial Field", city: "Philadelphia", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 20", time: "4:00 PM ET",
        home: "Germany", away: "Ivory Coast",
        venue: "BMO Field", city: "Toronto", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 20", time: "8:00 PM ET",
        home: "Ecuador", away: "Curaçao",
        venue: "Arrowhead Stadium", city: "Kansas City", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 25", time: "4:00 PM ET",
        home: "Curaçao", away: "Ivory Coast",
        venue: "Lincoln Financial Field", city: "Philadelphia", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 25", time: "4:00 PM ET",
        home: "Ecuador", away: "Germany",
        venue: "MetLife Stadium", city: "East Rutherford", status: "upcoming",
      },
    ],
  },

  // ── GROUP F ──────────────────────────────────────────────────────────────
  {
    id: "F",
    teams: ["Netherlands", "Japan", "Sweden", "Tunisia"],
    fixtures: [
      {
        matchday: 1, date: "Jun 14", time: "4:00 PM ET",
        home: "Netherlands", away: "Japan",
        venue: "AT&T Stadium", city: "Arlington", status: "upcoming",
      },
      {
        matchday: 1, date: "Jun 14", time: "10:00 PM ET",
        home: "Sweden", away: "Tunisia",
        venue: "Estadio BBVA", city: "Monterrey", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 20", time: "1:00 PM ET",
        home: "Netherlands", away: "Sweden",
        venue: "NRG Stadium", city: "Houston", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 21", time: "12:00 AM ET",
        home: "Tunisia", away: "Japan",
        venue: "Estadio BBVA", city: "Monterrey", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 25", time: "7:00 PM ET",
        home: "Japan", away: "Sweden",
        venue: "AT&T Stadium", city: "Arlington", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 25", time: "7:00 PM ET",
        home: "Tunisia", away: "Netherlands",
        venue: "Arrowhead Stadium", city: "Kansas City", status: "upcoming",
      },
    ],
  },

  // ── GROUP G ──────────────────────────────────────────────────────────────
  {
    id: "G",
    teams: ["Belgium", "Egypt", "Iran", "New Zealand"],
    fixtures: [
      {
        matchday: 1, date: "Jun 15", time: "3:00 PM ET",
        home: "Belgium", away: "Egypt",
        venue: "Lumen Field", city: "Seattle", status: "upcoming",
      },
      {
        matchday: 1, date: "Jun 15", time: "9:00 PM ET",
        home: "Iran", away: "New Zealand",
        venue: "SoFi Stadium", city: "Los Angeles", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 21", time: "3:00 PM ET",
        home: "Belgium", away: "Iran",
        venue: "SoFi Stadium", city: "Los Angeles", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 21", time: "9:00 PM ET",
        home: "New Zealand", away: "Egypt",
        venue: "BC Place", city: "Vancouver", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 26", time: "11:00 PM ET",
        home: "Egypt", away: "Iran",
        venue: "Lumen Field", city: "Seattle", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 26", time: "11:00 PM ET",
        home: "New Zealand", away: "Belgium",
        venue: "BC Place", city: "Vancouver", status: "upcoming",
      },
    ],
  },

  // ── GROUP H ──────────────────────────────────────────────────────────────
  {
    id: "H",
    teams: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
    fixtures: [
      {
        matchday: 1, date: "Jun 15", time: "12:00 PM ET",
        home: "Spain", away: "Cape Verde",
        venue: "Mercedes-Benz Stadium", city: "Atlanta", status: "upcoming",
      },
      {
        matchday: 1, date: "Jun 15", time: "6:00 PM ET",
        home: "Saudi Arabia", away: "Uruguay",
        venue: "Hard Rock Stadium", city: "Miami", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 21", time: "12:00 PM ET",
        home: "Spain", away: "Saudi Arabia",
        venue: "Mercedes-Benz Stadium", city: "Atlanta", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 21", time: "6:00 PM ET",
        home: "Uruguay", away: "Cape Verde",
        venue: "Hard Rock Stadium", city: "Miami", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 26", time: "8:00 PM ET",
        home: "Cape Verde", away: "Saudi Arabia",
        venue: "NRG Stadium", city: "Houston", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 26", time: "8:00 PM ET",
        home: "Uruguay", away: "Spain",
        venue: "Estadio Akron", city: "Guadalajara", status: "upcoming",
      },
    ],
  },

  // ── GROUP I ──────────────────────────────────────────────────────────────
  {
    id: "I",
    teams: ["France", "Senegal", "Iraq", "Norway"],
    fixtures: [
      {
        matchday: 1, date: "Jun 16", time: "3:00 PM ET",
        home: "France", away: "Senegal",
        venue: "MetLife Stadium", city: "East Rutherford", status: "upcoming",
      },
      {
        matchday: 1, date: "Jun 16", time: "6:00 PM ET",
        home: "Iraq", away: "Norway",
        venue: "Gillette Stadium", city: "Foxborough", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 22", time: "5:00 PM ET",
        home: "France", away: "Iraq",
        venue: "Lincoln Financial Field", city: "Philadelphia", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 22", time: "8:00 PM ET",
        home: "Norway", away: "Senegal",
        venue: "MetLife Stadium", city: "East Rutherford", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 26", time: "3:00 PM ET",
        home: "Norway", away: "France",
        venue: "Gillette Stadium", city: "Foxborough", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 26", time: "3:00 PM ET",
        home: "Senegal", away: "Iraq",
        venue: "BMO Field", city: "Toronto", status: "upcoming",
      },
    ],
  },

  // ── GROUP J ──────────────────────────────────────────────────────────────
  {
    id: "J",
    teams: ["Argentina", "Algeria", "Austria", "Jordan"],
    fixtures: [
      {
        matchday: 1, date: "Jun 16", time: "9:00 PM ET",
        home: "Argentina", away: "Algeria",
        venue: "Arrowhead Stadium", city: "Kansas City", status: "upcoming",
      },
      {
        matchday: 1, date: "Jun 17", time: "12:00 AM ET",
        home: "Austria", away: "Jordan",
        venue: "Levi's Stadium", city: "Santa Clara", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 22", time: "1:00 PM ET",
        home: "Argentina", away: "Austria",
        venue: "AT&T Stadium", city: "Arlington", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 23", time: "11:00 PM ET",
        home: "Jordan", away: "Algeria",
        venue: "Levi's Stadium", city: "Santa Clara", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 27", time: "10:00 PM ET",
        home: "Algeria", away: "Austria",
        venue: "Arrowhead Stadium", city: "Kansas City", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 27", time: "10:00 PM ET",
        home: "Jordan", away: "Argentina",
        venue: "AT&T Stadium", city: "Arlington", status: "upcoming",
      },
    ],
  },

  // ── GROUP K ──────────────────────────────────────────────────────────────
  {
    id: "K",
    teams: ["Portugal", "Congo DR", "Uzbekistan", "Colombia"],
    fixtures: [
      {
        matchday: 1, date: "Jun 17", time: "1:00 PM ET",
        home: "Portugal", away: "Congo DR",
        venue: "NRG Stadium", city: "Houston", status: "upcoming",
      },
      {
        matchday: 1, date: "Jun 17", time: "10:00 PM ET",
        home: "Uzbekistan", away: "Colombia",
        venue: "Estadio Azteca", city: "Mexico City", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 23", time: "1:00 PM ET",
        home: "Portugal", away: "Uzbekistan",
        venue: "NRG Stadium", city: "Houston", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 23", time: "10:00 PM ET",
        home: "Colombia", away: "Congo DR",
        venue: "Estadio Akron", city: "Guadalajara", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 27", time: "7:30 PM ET",
        home: "Colombia", away: "Portugal",
        venue: "Hard Rock Stadium", city: "Miami", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 27", time: "7:30 PM ET",
        home: "Congo DR", away: "Uzbekistan",
        venue: "Mercedes-Benz Stadium", city: "Atlanta", status: "upcoming",
      },
    ],
  },

  // ── GROUP L ──────────────────────────────────────────────────────────────
  {
    id: "L",
    teams: ["England", "Croatia", "Ghana", "Panama"],
    fixtures: [
      {
        matchday: 1, date: "Jun 17", time: "4:00 PM ET",
        home: "England", away: "Croatia",
        venue: "AT&T Stadium", city: "Arlington", status: "upcoming",
      },
      {
        matchday: 1, date: "Jun 17", time: "7:00 PM ET",
        home: "Ghana", away: "Panama",
        venue: "BMO Field", city: "Toronto", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 23", time: "4:00 PM ET",
        home: "England", away: "Ghana",
        venue: "Gillette Stadium", city: "Foxborough", status: "upcoming",
      },
      {
        matchday: 2, date: "Jun 23", time: "7:00 PM ET",
        home: "Panama", away: "Croatia",
        venue: "BMO Field", city: "Toronto", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 27", time: "5:00 PM ET",
        home: "Panama", away: "England",
        venue: "MetLife Stadium", city: "East Rutherford", status: "upcoming",
      },
      {
        matchday: 3, date: "Jun 27", time: "5:00 PM ET",
        home: "Croatia", away: "Ghana",
        venue: "Lincoln Financial Field", city: "Philadelphia", status: "upcoming",
      },
    ],
  },
];
