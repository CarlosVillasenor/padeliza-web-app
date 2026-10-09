import type { Tournament, TournamentStatus } from "../types/tournament.ts";
import { isMatchComplete, isRoundComplete } from "./scoring.ts";

export function pendingMatches(tournament: Tournament): number {
  return tournament.schedule.reduce(
    (total, round) => total + round.matches.filter((m) => !isMatchComplete(m)).length,
    0,
  );
}

/** Number of configured Mexicano rounds that have not yet been generated. */
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

/**
 * Determines whether a round's scores can still be changed.
 * Americano keeps every round editable until completion; Mexicano locks earlier
 * rounds once a later round has been generated from their results.
 */
export function canEditScores(
  tournament: Tournament,
  roundNumber: number,
): boolean {
  if (tournament.status === "completed") return false;
  if (tournament.format === "americano") return true;
  return roundNumber === tournament.schedule.length;
}

/** A Mexicano round can be generated only after completing the current round. */
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

/** Returns the earliest unfinished round, or the latest round if all are done. */
export function defaultRoundNumber(tournament: Tournament): number {
  const open = tournament.schedule.find((r) => !isRoundComplete(r));
  return (open ?? tournament.schedule.at(-1))?.number ?? 1;
}
