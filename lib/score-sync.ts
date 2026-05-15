/**
 * score-sync.ts
 * Backend logic for polling TheSportsDB (free) and updating match scores,
 * group standings, and knockout bracket slots in Supabase.
 *
 * Called by: POST /api/sync-scores  (triggered by external cron every ~2 min)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { GROUPS } from "./wc2026-data";

// ─── Admin Supabase client (bypasses RLS) ─────────────────────────────────────

function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── TheSportsDB types ────────────────────────────────────────────────────────

interface TSDBEvent {
  idEvent: string;
  strLeague: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;   // "Match Finished" | "Not Started" | "In Progress" | "1H" | "HT" | "2H" …
  dateEvent: string;   // "2026-06-12"
}

// Statuses that mean the match is fully over
const FINISHED = new Set([
  "Match Finished",
  "FT",
  "AET",          // after extra time
  "AP",           // after penalties
  "After Extra Time",
  "After Penalties",
  "Finished",
]);

// ─── Team name normalization ──────────────────────────────────────────────────
// Maps TheSportsDB team names → keys used in wc2026-data.ts

const TEAM_ALIASES: Record<string, string> = {
  "USA":                              "United States",
  "Bosnia":                           "Bosnia and Herzegovina",
  "Bosnia-Herzegovina":               "Bosnia and Herzegovina",
  "Bosnia & Herzegovina":             "Bosnia and Herzegovina",
  "Czech Republic":                   "Czechia",
  "Turkey":                           "Türkiye",
  "Cote d'Ivoire":                    "Ivory Coast",
  "Côte d'Ivoire":                    "Ivory Coast",
  "Cote D'Ivoire":                    "Ivory Coast",
  "Korea Republic":                   "South Korea",
  "Republic of Korea":                "South Korea",
  "DR Congo":                         "Congo DR",
  "Democratic Republic of Congo":     "Congo DR",
  "DRC":                              "Congo DR",
  "Cape Verde Islands":               "Cape Verde",
  "Curacao":                          "Curaçao",
};

function normalizeTeam(raw: string): string {
  return TEAM_ALIASES[raw] ?? raw;
}

// ─── Fixture lookup ───────────────────────────────────────────────────────────
// Returns the group ID if a (home, away) pair is a group stage match.
// Returns null for knockout matches.

function findGroupId(home: string, away: string): string | null {
  for (const g of GROUPS) {
    for (const f of g.fixtures) {
      if (
        (f.home === home && f.away === away) ||
        (f.home === away && f.away === home)
      ) {
        return g.id;
      }
    }
  }
  return null;
}

// ─── TheSportsDB fetch ────────────────────────────────────────────────────────
// Fetches all Soccer events for today (Amsterdam local date) and filters for
// FIFA World Cup matches only.

export async function fetchTodayWCEvents(): Promise<TSDBEvent[]> {
  // Use Amsterdam time (UTC+2) so "today" aligns with European viewing hours
  const amsterdamNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const today = amsterdamNow.toISOString().split("T")[0];

  const url = `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}&s=Soccer`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: { "User-Agent": "SupportYourColors/1.0" },
  });

  if (!res.ok) throw new Error(`TheSportsDB HTTP ${res.status}`);

  const body = await res.json() as { events: TSDBEvent[] | null };
  const events = body.events ?? [];

  return events.filter((e) =>
    e.strLeague?.toLowerCase().includes("world cup")
  );
}

// ─── Group standings ──────────────────────────────────────────────────────────
// Recalculates standings for one group from all finished match_results rows.

async function recalculateStandings(db: SupabaseClient, groupId: string) {
  const group = GROUPS.find((g) => g.id === groupId);
  if (!group) return;

  // Build a zero-state row for every team in the group
  const rows = new Map(
    group.teams.map((team) => [
      team,
      { team, group_id: groupId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
    ])
  );

  // Fetch every finished result that involves two teams from this group
  const { data: results } = await db
    .from("match_results")
    .select("home_team, away_team, home_score, away_score, winner")
    .in("home_team", group.teams)
    .in("away_team", group.teams)
    .eq("status", "finished");

  for (const r of results ?? []) {
    const h = rows.get(r.home_team);
    const a = rows.get(r.away_team);
    if (!h || !a || r.home_score == null || r.away_score == null) continue;

    h.played++;   a.played++;
    h.gf += r.home_score; h.ga += r.away_score;
    a.gf += r.away_score; a.ga += r.home_score;

    if (r.winner === r.home_team)      { h.won++; a.lost++; h.points += 3; }
    else if (r.winner === r.away_team) { a.won++; h.lost++; a.points += 3; }
    else                               { h.drawn++; a.drawn++; h.points += 1; a.points += 1; }
  }

  // Sort: points → GD → GF (head-to-head is omitted for simplicity)
  const sorted = [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });

  // Upsert every row with its calculated rank
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    await db.from("group_standings").upsert(
      {
        group_id: groupId,
        team:     s.team,
        played:   s.played,
        won:      s.won,
        drawn:    s.drawn,
        lost:     s.lost,
        gf:       s.gf,
        ga:       s.ga,
        gd:       s.gf - s.ga,
        points:   s.points,
        rank:     i + 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "group_id,team" }
    );
  }
}

// ─── WC 2026 R32 bracket seedings ────────────────────────────────────────────
// FIFA's published bracket path for matches 65-76 (the 12 group-determined slots).
// Matches 77-80 use the 8 best 3rd-place teams — those require FIFA's seeding
// formula and are left for a future update.

const R32_SEEDINGS = [
  { match: 65, home: { rank: 1, group: "A" }, away: { rank: 2, group: "B" } },
  { match: 66, home: { rank: 1, group: "C" }, away: { rank: 2, group: "D" } },
  { match: 67, home: { rank: 1, group: "E" }, away: { rank: 2, group: "F" } },
  { match: 68, home: { rank: 1, group: "G" }, away: { rank: 2, group: "H" } },
  { match: 69, home: { rank: 1, group: "I" }, away: { rank: 2, group: "J" } },
  { match: 70, home: { rank: 1, group: "K" }, away: { rank: 2, group: "L" } },
  { match: 71, home: { rank: 1, group: "B" }, away: { rank: 2, group: "A" } },
  { match: 72, home: { rank: 1, group: "D" }, away: { rank: 2, group: "C" } },
  { match: 73, home: { rank: 1, group: "F" }, away: { rank: 2, group: "E" } },
  { match: 74, home: { rank: 1, group: "H" }, away: { rank: 2, group: "G" } },
  { match: 75, home: { rank: 1, group: "J" }, away: { rank: 2, group: "I" } },
  { match: 76, home: { rank: 1, group: "L" }, away: { rank: 2, group: "K" } },
] as const;

// ─── Knockout bracket advancement paths ───────────────────────────────────────
// Maps each match's winner ("W65") or loser ("L93") to the next slot.

const NEXT_SLOT: Record<string, { match: number; pos: "home" | "away" }> = {
  // R32 → R16
  W65: { match: 81, pos: "home" }, W66: { match: 81, pos: "away" },
  W67: { match: 82, pos: "home" }, W68: { match: 82, pos: "away" },
  W69: { match: 83, pos: "home" }, W70: { match: 83, pos: "away" },
  W71: { match: 84, pos: "home" }, W72: { match: 84, pos: "away" },
  W73: { match: 85, pos: "home" }, W74: { match: 85, pos: "away" },
  W75: { match: 86, pos: "home" }, W76: { match: 86, pos: "away" },
  W77: { match: 87, pos: "home" }, W78: { match: 87, pos: "away" },
  W79: { match: 88, pos: "home" }, W80: { match: 88, pos: "away" },
  // R16 → QF
  W81: { match: 89, pos: "home" }, W82: { match: 89, pos: "away" },
  W83: { match: 90, pos: "home" }, W84: { match: 90, pos: "away" },
  W85: { match: 91, pos: "home" }, W86: { match: 91, pos: "away" },
  W87: { match: 92, pos: "home" }, W88: { match: 92, pos: "away" },
  // QF → SF
  W89: { match: 93, pos: "home" }, W90: { match: 93, pos: "away" },
  W91: { match: 94, pos: "home" }, W92: { match: 94, pos: "away" },
  // SF → Final & 3rd
  W93: { match: 96, pos: "home" }, W94: { match: 96, pos: "away" },
  L93: { match: 95, pos: "home" }, L94: { match: 95, pos: "away" },
};

// Tries to populate R32 team slots once a group's standings are known
async function tryPopulateR32Slots(db: SupabaseClient) {
  for (const seed of R32_SEEDINGS) {
    // Fetch the current state of this R32 slot
    const { data: slot } = await db
      .from("knockout_matches")
      .select("home_team, away_team")
      .eq("round", "R32")
      .eq("match_number", seed.match)
      .maybeSingle();

    // Both teams already set — nothing to do
    if (slot?.home_team && slot?.away_team) continue;

    const [homeStanding, awayStanding] = await Promise.all([
      db.from("group_standings").select("team").eq("group_id", seed.home.group).eq("rank", seed.home.rank).maybeSingle(),
      db.from("group_standings").select("team").eq("group_id", seed.away.group).eq("rank", seed.away.rank).maybeSingle(),
    ]);

    const homeTeam = homeStanding.data?.team ?? null;
    const awayTeam = awayStanding.data?.team ?? null;

    if (!homeTeam && !awayTeam) continue; // Group not far enough along yet

    await db.from("knockout_matches").upsert(
      {
        round:        "R32",
        match_number: seed.match,
        home_team:    homeTeam,
        away_team:    awayTeam,
        home_source:  `${seed.home.rank}${seed.home.group}`,
        away_source:  `${seed.away.rank}${seed.away.group}`,
        updated_at:   new Date().toISOString(),
      },
      { onConflict: "round,match_number" }
    );
  }
}

// Writes a team into the next knockout slot after a match finishes
async function advanceInBracket(
  db: SupabaseClient,
  matchNumber: number,
  winner: string,
  loser: string
) {
  for (const ref of [`W${matchNumber}`, `L${matchNumber}`] as const) {
    const next = NEXT_SLOT[ref];
    if (!next) continue;

    const team = ref.startsWith("W") ? winner : loser;
    const field = next.pos === "home" ? "home_team" : "away_team";

    await db.from("knockout_matches").upsert(
      {
        round:        await getRoundForMatch(db, next.match),
        match_number: next.match,
        [field]:      team,
        updated_at:   new Date().toISOString(),
      },
      { onConflict: "round,match_number" }
    );
  }
}

async function getRoundForMatch(db: SupabaseClient, matchNumber: number): Promise<string> {
  const { data } = await db
    .from("knockout_matches")
    .select("round")
    .eq("match_number", matchNumber)
    .maybeSingle();
  return data?.round ?? "Unknown";
}

// ─── Main export: run one full sync pass ─────────────────────────────────────

export interface SyncResult {
  eventsFound:  number;
  updated:      number;
  processed:    number;
  errors:       string[];
}

export async function runScoreSync(): Promise<SyncResult> {
  const db = adminClient();
  const result: SyncResult = { eventsFound: 0, updated: 0, processed: 0, errors: [] };

  const events = await fetchTodayWCEvents();
  result.eventsFound = events.length;

  for (const event of events) {
    try {
      const homeTeam = normalizeTeam(event.strHomeTeam);
      const awayTeam = normalizeTeam(event.strAwayTeam);
      const finished = FINISHED.has(event.strStatus);

      // Nothing useful to record yet if the match hasn't started and has no score
      if (!finished && event.intHomeScore == null) continue;

      // Guard: skip if already fully processed (bracket logic already ran)
      const { data: existing } = await db
        .from("match_results")
        .select("processed")
        .eq("external_id", event.idEvent)
        .maybeSingle();

      if (existing?.processed) continue;

      // ── Upsert the score ──────────────────────────────────────────────────
      const homeScore = event.intHomeScore != null ? parseInt(event.intHomeScore, 10) : null;
      const awayScore = event.intAwayScore != null ? parseInt(event.intAwayScore, 10) : null;

      let winner: string | null = null;
      if (finished && homeScore != null && awayScore != null) {
        if (homeScore > awayScore)      winner = homeTeam;
        else if (awayScore > homeScore) winner = awayTeam;
        else                            winner = "draw";
      }

      await db.from("match_results").upsert(
        {
          external_id: event.idEvent,
          home_team:   homeTeam,
          away_team:   awayTeam,
          match_date:  event.dateEvent,
          home_score:  homeScore,
          away_score:  awayScore,
          status:      finished ? "finished" : "live",
          winner,
          updated_at:  new Date().toISOString(),
        },
        { onConflict: "external_id" }
      );
      result.updated++;

      // ── Post-processing (only on first finish) ────────────────────────────
      if (!finished) continue;

      const groupId = findGroupId(homeTeam, awayTeam);

      if (groupId) {
        // Group stage: recalculate standings then try to seed R32 slots
        await recalculateStandings(db, groupId);
        await tryPopulateR32Slots(db);
      } else {
        // Knockout: advance winner (and loser to 3rd-place if applicable)
        if (winner && winner !== "draw") {
          const { data: koMatch } = await db
            .from("knockout_matches")
            .select("match_number")
            .eq("home_team", homeTeam)
            .eq("away_team", awayTeam)
            .maybeSingle();

          if (koMatch) {
            const loser = winner === homeTeam ? awayTeam : homeTeam;
            await advanceInBracket(db, koMatch.match_number, winner, loser);

            // Mark this knockout slot as done
            await db
              .from("knockout_matches")
              .update({ winner, status: "finished", processed: true, updated_at: new Date().toISOString() })
              .eq("match_number", koMatch.match_number);
          }
        }
      }

      // Mark match_result as processed so bracket logic never runs twice
      await db
        .from("match_results")
        .update({ processed: true })
        .eq("external_id", event.idEvent);

      result.processed++;
    } catch (err) {
      const msg = `${event.strHomeTeam} vs ${event.strAwayTeam}: ${err instanceof Error ? err.message : String(err)}`;
      result.errors.push(msg);
      console.error("[score-sync]", msg);
    }
  }

  return result;
}
