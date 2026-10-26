import type {
  Tournament,
  TournamentInput,
  TournamentValidationError,
} from "../types/tournament.ts";
import { isMatchComplete, isValidScore } from "./scoring.ts";

export const tournamentFormats = ["americano", "mexicano"] as const;
export const minPlayers = 4;
export const maxPlayers = 20;
export const maxCourts = 4;
export const maxAmericanoRounds = 100;
const perfectRotationCounts = new Set([4, 8, 12]);

export function hasPerfectAmericanoRotation(players: number): boolean {
  return perfectRotationCounts.has(players);
}

export function playerCountError(
  count: number,
  format: TournamentInput["format"],
): "playerCount" | "mexicanoCourts" | null {
  if (!Number.isInteger(count) || count < minPlayers || count > maxPlayers)
    return "playerCount";
  if (
    format === "mexicano" &&
    (count % 4 !== 0 || count / 4 > maxCourts)
  )
    return "mexicanoCourts";
  return null;
}

export function americanoRounds(players: number, courts: number): number {
  const matchesPerRotation = Math.floor(players / 4);
  const batches = Math.ceil(matchesPerRotation / courts);
  return perfectRotationCounts.has(players)
    ? (players - 1) * batches
    : players * batches;
}

export function americanoMatchesPerPlayer(players: number): number {
  return perfectRotationCounts.has(players)
    ? players - 1
    : 4 * Math.floor(players / 4);
}

export function validateTournament(
  input: TournamentInput,
): TournamentValidationError | null {
  if (!input.name.trim() || input.name.trim().length > 80) return "name";
  if (!tournamentFormats.includes(input.format)) return "format";
  const countError = playerCountError(input.players.length, input.format);
  if (countError) return countError;
  const names = input.players.map((player) =>
    player.name.trim().toLocaleLowerCase("es"),
  );
  if (names.some((name) => !name || name.length > 50)) return "playerName";
  if (new Set(names).size !== names.length) return "duplicatePlayerName";
  if (
    input.players.some((p) => !p.id) ||
    new Set(input.players.map((p) => p.id)).size !== names.length
  )
    return "duplicatePlayerId";
  if (
    !Number.isInteger(input.courts) ||
    input.courts < 1 ||
    input.courts > Math.min(maxCourts, Math.floor(input.players.length / 4))
  )
    return "courts";
  if (input.format === "mexicano" && input.players.length !== input.courts * 4)
    return "mexicanoCourts";
  if (!Number.isInteger(input.points) || input.points < 1 || input.points > 100)
    return "points";
  if (
    !Number.isInteger(input.rounds) ||
    input.rounds < 1 ||
    input.rounds > maxAmericanoRounds
  )
    return "rounds";
  if (
    input.format === "americano" &&
    input.rounds !== americanoRounds(input.players.length, input.courts)
  )
    return "roundsMismatch";
  return null;
}

// Checks the stored schedule and status against the tournament configuration.
export function isValidSchedule(tournament: Tournament): boolean {
  const { schedule, players, courts, points, rounds, format, status } =
    tournament;
  if (!["scheduled", "in-progress", "completed"].includes(status)) return false;
  if (!Array.isArray(schedule) || schedule.length < 1) return false;
  if (
    format === "americano"
      ? schedule.length !== rounds
      : schedule.length > rounds
  )
    return false;
  const ids = new Set(players.map((p) => p.id));
  const matchIds = new Set<string>();
  const complete = schedule.every((round, index) => {
    if (round.number !== index + 1 || !Array.isArray(round.matches)) return false;
    if (round.matches.length < 1 || round.matches.length > courts) return false;
    const inRound = new Set<string>();
    const courtsInRound = new Set<number>();
    const validMatches = round.matches.every((match) => {
      const team = [...match.teamA, ...match.teamB];
      if (
        typeof match.id !== "string" ||
        matchIds.has(match.id) ||
        !Number.isInteger(match.court) ||
        match.court < 1 ||
        match.court > courts ||
        courtsInRound.has(match.court) ||
        match.teamA.length !== 2 ||
        match.teamB.length !== 2 ||
        team.some((id) => !ids.has(id) || inRound.has(id))
      )
        return false;
      matchIds.add(match.id);
      courtsInRound.add(match.court);
      team.forEach((id) => inRound.add(id));
      if (match.scoreA === null || match.scoreB === null)
        return match.scoreA === null && match.scoreB === null;
      return isValidScore(points, match.scoreA, match.scoreB);
    });
    if (!validMatches) return false;
    if (round.byes === undefined) return true;
    if (!Array.isArray(round.byes)) return false;
    const byeIds = new Set(round.byes);
    return (
      byeIds.size === round.byes.length &&
      round.byes.every((id) => ids.has(id) && !inRound.has(id)) &&
      byeIds.size + inRound.size === ids.size
    );
  });
  if (!complete) return false;
  const finished =
    schedule.length === rounds &&
    schedule.every((r) => r.matches.every(isMatchComplete));
  if (status === "completed") return finished;
  const started = schedule.some((r) => r.matches.some(isMatchComplete));
  return status === "in-progress" ? started : !started;
}
