// Check what TheSportsDB returns for Argentina's recent/last events
const res = await fetch("https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=Argentina");
const { teams } = await res.json();
const team = teams?.find(t => t.strSport === "Soccer");
console.log("Team id:", team?.idTeam, team?.strTeam);

const res2 = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${team.idTeam}`);
const { results } = await res2.json();
const wc = results?.filter(e => e.strLeague?.toLowerCase().includes("world cup"));
console.log("Last WC events:");
for (const e of wc ?? []) {
  console.log(`  ${e.dateEvent} ${e.strHomeTeam} ${e.intHomeScore}-${e.intAwayScore} ${e.strAwayTeam} | status: ${e.strStatus}`);
}
