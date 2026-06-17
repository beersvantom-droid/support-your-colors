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
// Fetches the entire FIFA World Cup 2026 season schedule in one call. Unlike
// TheSportsDB's per-date `eventsday.php` endpoint (which is sparse and misses
// most World Cup fixtures), `eventsseason.php` returns every match in the
// season along with its current score/status — so every finished or live
// result is always picked up, regardless of which date it falls on.

const WC2026_LEAGUE_ID = "4429";
const WC2026_SEASON = "2026";
const TSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";

async function tsdbFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${TSDB_BASE}/${path}`, {
    signal: AbortSignal.timeout(15_000),
    headers: { "User-Agent": "SupportYourColors/1.0" },
  });
  if (!res.ok) throw new Error(`TheSportsDB HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

const isWorldCup = (e: TSDBEvent) =>
  e.strLeague?.toLowerCase().includes("world cup");

// Names to try against searchteams.php for a given normalized team name —
// includes the canonical name plus any TheSportsDB aliases that map to it.
function searchNamesFor(team: string): string[] {
  const aliases = Object.entries(TEAM_ALIASES)
    .filter(([, normalized]) => normalized === team)
    .map(([raw]) => raw);
  return [team, ...aliases];
}

// eventsseason.php misses some results entirely (TheSportsDB updates it on
// its own schedule). For matches we still consider "pending", fall back to
// each team's eventslast.php, which TheSportsDB tends to update sooner.
// Bound how many teams we look up per run — each lookup costs up to two
// TheSportsDB requests, and the free API rate-limits aggressively.
const MAX_PENDING_TEAM_LOOKUPS = 2;

async function fetchEventsForPendingTeams(db: SupabaseClient): Promise<TSDBEvent[]> {
  const amsterdamNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const today = amsterdamNow.toISOString().split("T")[0];
  const yesterday = new Date(amsterdamNow.getTime() - 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];

  // Only matches recent enough that a result is plausible — oldest first, so
  // long-pending matches get checked before today's (likely not-yet-played) ones.
  const { data: pending } = await db
    .from("match_results")
    .select("home_team, away_team")
    .neq("status", "finished")
    .gte("match_date", yesterday)
    .lte("match_date", today)
    .order("match_date", { ascending: true });

  const teams = new Set<string>();
  for (const row of pending ?? []) {
    if (row.home_team) teams.add(row.home_team);
    if (row.away_team) teams.add(row.away_team);
  }

  const extraEvents: TSDBEvent[] = [];

  for (const team of [...teams].slice(0, MAX_PENDING_TEAM_LOOKUPS)) {
    try {
      let teamId: string | null = null;
      for (const name of searchNamesFor(team)) {
        const body = await tsdbFetch<{ teams: { idTeam: string; strSport: string }[] | null }>(
          `searchteams.php?t=${encodeURIComponent(name)}`
        );
        const match = (body.teams ?? []).find((t) => t.strSport === "Soccer");
        if (match) { teamId = match.idTeam; break; }
      }
      if (!teamId) continue;

      const body = await tsdbFetch<{ results: TSDBEvent[] | null }>(
        `eventslast.php?id=${teamId}`
      );
      extraEvents.push(...(body.results ?? []).filter(isWorldCup));
    } catch (err) {
      console.error(`[score-sync] failed to fetch last events for ${team}:`, err);
    }
  }

  return extraEvents;
}

// eventspastleague.php returns recently-finished matches for the league —
// TheSportsDB sometimes updates this before eventsseason.php catches up.
async function fetchRecentPastLeagueEvents(): Promise<TSDBEvent[]> {
  try {
    const body = await tsdbFetch<{ events: TSDBEvent[] | null }>(
      `eventspastleague.php?id=${WC2026_LEAGUE_ID}`
    );
    return (body.events ?? []).filter(isWorldCup);
  } catch (err) {
    console.error("[score-sync] failed to fetch eventspastleague:", err);
    return [];
  }
}

export async function fetchWCEvents(db: SupabaseClient): Promise<TSDBEvent[]> {
  const body = await tsdbFetch<{ events: TSDBEvent[] | null }>(
    `eventsseason.php?id=${WC2026_LEAGUE_ID}&s=${WC2026_SEASON}`
  );
  const seasonEvents = (body.events ?? []).filter(isWorldCup);

  const [pastLeagueEvents, extraEvents] = await Promise.all([
    fetchRecentPastLeagueEvents(),
    fetchEventsForPendingTeams(db),
  ]);

  const seen = new Set(seasonEvents.map((e) => e.idEvent));
  for (const e of [...pastLeagueEvents, ...extraEvents]) {
    if (!seen.has(e.idEvent)) {
      seasonEvents.push(e);
      seen.add(e.idEvent);
    }
  }

  return seasonEvents;
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

  // Fetch every result (finished or live) that involves two teams from this group
  const { data: results } = await db
    .from("match_results")
    .select("home_team, away_team, home_score, away_score, status")
    .in("home_team", group.teams)
    .in("away_team", group.teams)
    .in("status", ["finished", "live"]);

  for (const r of results ?? []) {
    const h = rows.get(r.home_team);
    const a = rows.get(r.away_team);
    if (!h || !a || r.home_score == null || r.away_score == null) continue;

    h.played++;   a.played++;
    h.gf += r.home_score; h.ga += r.away_score;
    a.gf += r.away_score; a.ga += r.home_score;

    // Determine result from the live score itself (works for live + finished)
    if (r.home_score > r.away_score)      { h.won++; a.lost++; h.points += 3; }
    else if (r.away_score > r.home_score) { a.won++; h.lost++; a.points += 3; }
    else                                   { h.drawn++; a.drawn++; h.points += 1; a.points += 1; }
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

// ─── Tournament points update ─────────────────────────────────────────────────
// Awards tournament points to supporters based on match results.

const TOURNAMENT_POINTS = { win: 500, draw: 250, loss: 100 } as const;

async function updateTournamentPoints(
  db: SupabaseClient,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
) {
  // Determine the outcome
  let homeOutcome: "win" | "draw" | "loss";
  let awayOutcome: "win" | "draw" | "loss";

  if (homeScore > awayScore) {
    homeOutcome = "win";
    awayOutcome = "loss";
  } else if (awayScore > homeScore) {
    homeOutcome = "loss";
    awayOutcome = "win";
  } else {
    homeOutcome = "draw";
    awayOutcome = "draw";
  }

  // Fetch all supporters of each team
  const [{ data: homeSupporters }, { data: awaySupporters }] = await Promise.all([
    db.from("profiles").select("id").eq("country", homeTeam),
    db.from("profiles").select("id").eq("country", awayTeam),
  ]);

  // Award points in batch
  const updates: { id: string; pointsToAdd: number }[] = [];

  for (const supporter of homeSupporters ?? []) {
    updates.push({ id: supporter.id, pointsToAdd: TOURNAMENT_POINTS[homeOutcome] });
  }
  for (const supporter of awaySupporters ?? []) {
    updates.push({ id: supporter.id, pointsToAdd: TOURNAMENT_POINTS[awayOutcome] });
  }

  // Execute all updates in parallel
  for (const { id, pointsToAdd } of updates) {
    await db.rpc("increment_tournament_points", {
      user_id: id,
      amount: pointsToAdd,
    });
  }
}

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

  const events = await fetchWCEvents(db);
  result.eventsFound = events.length;

  for (const event of events) {
    try {
      const homeTeam = normalizeTeam(event.strHomeTeam);
      const awayTeam = normalizeTeam(event.strAwayTeam);
      const finished = FINISHED.has(event.strStatus);

      // Nothing useful to record yet if the match hasn't started and has no score
      if (!finished && event.intHomeScore == null) continue;

      // Guard: skip if already fully processed (bracket logic already ran).
      // Match against (home_team, away_team) only — NOT match_date or
      // external_id. Pre-seeded fixture rows use a placeholder external_id
      // and our fixture date can be off by a day vs. TheSportsDB's
      // dateEvent (timezone differences), so matching on teams alone is
      // what prevents duplicate rows from being created.
      const { data: existingRows } = await db
        .from("match_results")
        .select("id, processed")
        .eq("home_team", homeTeam)
        .eq("away_team", awayTeam);

      const existingRow = existingRows?.[0] ?? null;

      if (existingRow?.processed) continue;

      // ── Upsert the score ──────────────────────────────────────────────────
      const homeScore = event.intHomeScore != null ? parseInt(event.intHomeScore, 10) : null;
      const awayScore = event.intAwayScore != null ? parseInt(event.intAwayScore, 10) : null;

      let winner: string | null = null;
      if (finished && homeScore != null && awayScore != null) {
        if (homeScore > awayScore)      winner = homeTeam;
        else if (awayScore > homeScore) winner = awayTeam;
        else                            winner = "draw";
      }

      const matchPayload = {
        external_id: event.idEvent,
        home_team:   homeTeam,
        away_team:   awayTeam,
        match_date:  event.dateEvent,
        home_score:  homeScore,
        away_score:  awayScore,
        status:      finished ? "finished" : "live",
        winner,
        updated_at:  new Date().toISOString(),
      };

      if (existingRow) {
        await db.from("match_results").update(matchPayload).eq("id", existingRow.id);
      } else {
        await db.from("match_results").insert(matchPayload);
      }
      result.updated++;

      // ── Post-processing: always recalculate standings if there's a score ────
      const groupId = findGroupId(homeTeam, awayTeam);

      if (homeScore != null && awayScore != null) {
        if (finished) {
          // Award tournament points only once when match is finished
          await updateTournamentPoints(db, homeTeam, awayTeam, homeScore, awayScore);
        }

        if (groupId) {
          // Group stage: always recalculate standings when there are scores
          await recalculateStandings(db, groupId);
          await tryPopulateR32Slots(db);
        }
      }

      // Only do knockout advancement if match is finished
      if (!finished) {
        result.processed++;
        continue;
      }

      if (!groupId) {
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
        .eq("home_team", homeTeam)
        .eq("away_team", awayTeam);

      result.processed++;
    } catch (err) {
      const msg = `${event.strHomeTeam} vs ${event.strAwayTeam}: ${err instanceof Error ? err.message : String(err)}`;
      result.errors.push(msg);
      console.error("[score-sync]", msg);
    }
  }

  // ── Catch up on results already in our DB but never fully processed ──────
  // TheSportsDB doesn't always return the same match twice (e.g. once a
  // match is no longer "pending" it may vanish from every source we poll).
  // So a match can end up "finished" in match_results with processed=false
  // and never get picked up by the loop above again. Handle those directly.
  const { data: stragglers } = await db
    .from("match_results")
    .select("home_team, away_team, home_score, away_score, winner")
    .eq("status", "finished")
    .eq("processed", false);

  for (const row of stragglers ?? []) {
    try {
      const { home_team: homeTeam, away_team: awayTeam, home_score: homeScore, away_score: awayScore, winner } = row;
      if (homeScore == null || awayScore == null) continue;

      await updateTournamentPoints(db, homeTeam, awayTeam, homeScore, awayScore);

      const groupId = findGroupId(homeTeam, awayTeam);
      if (groupId) {
        await recalculateStandings(db, groupId);
        await tryPopulateR32Slots(db);
      } else if (winner && winner !== "draw") {
        const { data: koMatch } = await db
          .from("knockout_matches")
          .select("match_number")
          .eq("home_team", homeTeam)
          .eq("away_team", awayTeam)
          .maybeSingle();

        if (koMatch) {
          const loser = winner === homeTeam ? awayTeam : homeTeam;
          await advanceInBracket(db, koMatch.match_number, winner, loser);
          await db
            .from("knockout_matches")
            .update({ winner, status: "finished", processed: true, updated_at: new Date().toISOString() })
            .eq("match_number", koMatch.match_number);
        }
      }

      await db
        .from("match_results")
        .update({ processed: true })
        .eq("home_team", homeTeam)
        .eq("away_team", awayTeam);

      result.processed++;
    } catch (err) {
      const msg = `straggler ${row.home_team} vs ${row.away_team}: ${err instanceof Error ? err.message : String(err)}`;
      result.errors.push(msg);
      console.error("[score-sync]", msg);
    }
  }

  // Always recompute every group's standings, even if no new events came in
  // this run. This keeps group_standings correct if a previous run's upsert
  // failed silently (e.g. the table didn't exist yet when a match was first
  // marked "processed", so it was never recalculated again).
  for (const group of GROUPS) {
    try {
      await recalculateStandings(db, group.id);
    } catch (err) {
      const msg = `recalculate ${group.id}: ${err instanceof Error ? err.message : String(err)}`;
      result.errors.push(msg);
      console.error("[score-sync]", msg);
    }
  }
  await tryPopulateR32Slots(db);

  return result;
}
