import type { Match, Round } from "../types/tournament.ts";

export type TeamSide = "a" | "b";

// Every match shares out exactly `points`, so the two scores always add up to it.
export function isValidScore(points: number, a: number, b: number): boolean {
  return (
    Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a + b === points
  );
}

export function opponentScore(points: number, score: number): number {
  return points - score;
}

// Picking one side's score derives the other, so users never enter an invalid total.
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
