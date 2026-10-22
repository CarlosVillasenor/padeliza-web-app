import type {
  Tournament,
  TournamentInput,
  TournamentValidationError,
} from "../types/tournament.ts";
import { isMatchComplete, isValidScore } from "./scoring.ts";

export const tournamentFormats = ["americano", "mexicano"] as const;
export const minPlayers = 4;
// At 24 players the schedule search is bounded to 12 partner teams per rotation.
export const maxPlayers = 24;
export const maxMexicanoPlayers = 12;
const maxMexicanoRounds = 100;

export function isValidPlayerCount(players: number): boolean {
  return Number.isInteger(players) && players >= minPlayers && players <= maxPlayers;
}

// Even counts have N-1 partnership rounds; odd counts need N rounds so every
// participant receives one bye in the round-robin factorization.
export function americanoRounds(players: number, courts: number): number {
  if (players < minPlayers || courts < 1) return 0;
  const rotations = players % 2 === 0 ? players - 1 : players;
  return rotations * Math.ceil(Math.floor(players / 4) / courts);
}

export function americanoPlayerMatchRange(
  players: number,
): readonly [number, number] {
  if (players < minPlayers) return [0, 0];
  const rotations = players % 2 === 0 ? players - 1 : players;
  const totalAppearances = rotations * Math.floor(players / 4) * 4;
  return [
    Math.floor(totalAppearances / players),
    Math.ceil(totalAppearances / players),
  ];
}

export function validateTournament(
  input: TournamentInput,
): TournamentValidationError | null {
  if (!input.name.trim() || input.name.trim().length > 80) return "name";
  if (!tournamentFormats.includes(input.format)) return "format";
  if (!isValidPlayerCount(input.players.length)) return "playerCount";
  if (
    input.format === "mexicano" &&
    (input.players.length > maxMexicanoPlayers || input.players.length % 4 !== 0)
  )
    return "mexicanoCourts";
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
    input.courts > input.players.length / 4
  )
    return "courts";
  if (
    input.format === "mexicano" &&
    input.players.length !== input.courts * 4
  )
    return "mexicanoCourts";
  if (!Number.isInteger(input.points) || input.points < 1 || input.points > 100)
    return "points";
  const maxRounds =
    input.format === "americano"
      ? americanoRounds(input.players.length, 1)
      : maxMexicanoRounds;
  if (
    !Number.isInteger(input.rounds) ||
    input.rounds < 1 ||
    input.rounds > maxRounds
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
  if (format === "americano" ? schedule.length !== rounds : schedule.length > rounds)
    return false;
  const ids = new Set(players.map((p) => p.id));
  const matchIds = new Set<string>();
  const complete = schedule.every((round, index) => {
    if (round.number !== index + 1 || !Array.isArray(round.matches)) return false;
    if (round.matches.length < 1 || round.matches.length > courts) return false;
    const inRound = new Set<string>();
    return round.matches.every((match) => {
      const team = [...match.teamA, ...match.teamB];
      if (
        typeof match.id !== "string" ||
        matchIds.has(match.id) ||
        !Number.isInteger(match.court) ||
        match.teamA.length !== 2 ||
        match.teamB.length !== 2 ||
        team.some((id) => !ids.has(id) || inRound.has(id))
      )
        return false;
      matchIds.add(match.id);
      team.forEach((id) => inRound.add(id));
      if (match.scoreA === null || match.scoreB === null)
        return match.scoreA === null && match.scoreB === null;
      return isValidScore(points, match.scoreA, match.scoreB);
    });
  });
  if (!complete) return false;
  const finished =
    schedule.length === rounds &&
    schedule.every((r) => r.matches.every(isMatchComplete));
  if (status === "completed") return finished;
  const started = schedule.some((r) => r.matches.some(isMatchComplete));
  return status === "in-progress" ? started : !started;
}
