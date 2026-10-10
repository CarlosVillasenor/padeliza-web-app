import type { Tournament, TournamentStatus } from "../types/tournament.ts";
import { isMatchComplete, isRoundComplete } from "./scoring.ts";

export function pendingMatches(tournament: Tournament): number {
  return tournament.schedule.reduce(
    (total, round) => total + round.matches.filter((m) => !isMatchComplete(m)).length,
    0,
  );
}

// Mexicano rounds that depend on results and have not been generated yet.
export function ungeneratedRounds(tournament: Tournament): number {
  return tournament.rounds - tournament.schedule.length;
}

export function canFinishTournament(tournament: Tournament): boolean {
  return (
    tournament.status !== "completed" &&
    ungeneratedRounds(tournament) === 0 &&
    pendingMatches(tournament) === 0
  );
}

// Americano allows editing any round until the tournament ends. In Mexicano the
// next round is paired from earlier results, so only the latest round stays open.
export function canEditScores(
  tournament: Tournament,
  roundNumber: number,
): boolean {
  if (tournament.status === "completed") return false;
  if (tournament.format === "americano") return true;
  return roundNumber === tournament.schedule.length;
}

// Prevent generating a new round until all matches in the current round have results.
export function canGenerateNextRound(tournament: Tournament): boolean {
  const current = tournament.schedule.at(-1);
  return (
    tournament.format === "mexicano" &&
    tournament.status !== "completed" &&
    !!current &&
    ungeneratedRounds(tournament) > 0 &&
    isRoundComplete(current)
  );
}

export function statusAfterScore(tournament: Tournament): TournamentStatus {
  if (tournament.status === "completed") return "completed";
  const started = tournament.schedule.some((r) =>
    r.matches.some(isMatchComplete),
  );
  return started ? "in-progress" : "scheduled";
}

// Round the user should see first: the earliest one still missing results.
export function defaultRoundNumber(tournament: Tournament): number {
  const open = tournament.schedule.find((r) => !isRoundComplete(r));
  return (open ?? tournament.schedule.at(-1))?.number ?? 1;
}
