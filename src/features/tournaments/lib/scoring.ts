import type { Match, Round } from "../types/tournament.ts";

export type TeamSide = "a" | "b";

/** Checks that both scores are non-negative integers totaling `points`. */
export function isValidScore(points: number, a: number, b: number): boolean {
  return (
    Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a + b === points
  );
}

export function opponentScore(points: number, score: number): number {
  return points - score;
}

/**
 * Produces both team scores from a selected side's score.
 * The caller is responsible for validating that `value` is allowed.
 */
export function scoresFromSelection(
  points: number,
  side: TeamSide,
  value: number,
): { scoreA: number; scoreB: number } {
  const other = opponentScore(points, value);
  return side === "a"
    ? { scoreA: value, scoreB: other }
    : { scoreA: other, scoreB: value };
}

export function isMatchComplete(match: Match): boolean {
  return match.scoreA !== null && match.scoreB !== null;
}

export function isRoundComplete(round: Round): boolean {
  return round.matches.every(isMatchComplete);
}
