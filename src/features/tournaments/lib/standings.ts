import type { StandingRow, Tournament } from "../types/tournament.ts";
import { isMatchComplete } from "./scoring.ts";

/**
 * Calculates standings from completed matches, ordering by points, wins, then
 * name. Players with equal points and wins share a position.
 */
export function computeStandings(tournament: Tournament): StandingRow[] {
  const totals = new Map(
    tournament.players.map((p) => [p.id, { points: 0, wins: 0 }]),
  );
  for (const round of tournament.schedule)
    for (const match of round.matches) {
      if (!isMatchComplete(match)) continue;
      const a = match.scoreA as number;
      const b = match.scoreB as number;
      for (const id of match.teamA) {
        const row = totals.get(id);
        if (row) {
          row.points += a;
          if (a > b) row.wins += 1;
        }
      }
      for (const id of match.teamB) {
        const row = totals.get(id);
        if (row) {
          row.points += b;
          if (b > a) row.wins += 1;
        }
      }
    }
  const sorted = tournament.players
    .map((p) => ({ playerId: p.id, name: p.name, ...totals.get(p.id)! }))
    .sort(
      (x, y) =>
        y.points - x.points ||
        y.wins - x.wins ||
        x.name.localeCompare(y.name, "es"),
    );
  // Players with identical points and wins share a position.
  return sorted.map((row, i) => {
    const first = sorted.findIndex(
      (o) => o.points === row.points && o.wins === row.wins,
    );
    return { ...row, position: i === 0 ? 1 : first + 1 };
  });
}
