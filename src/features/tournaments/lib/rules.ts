import type {
  Tournament,
  TournamentInput,
  TournamentValidationError,
} from "../types/tournament.ts";
import { isMatchComplete, isValidScore } from "./scoring.ts";

export const tournamentFormats = ["americano", "mexicano"] as const;
export const playerCounts = [4, 8, 12];
export const maxPlayers = Math.max(...playerCounts);

// Each complete partner rotation has N/4 matches. Finish its batches before
// starting the next rotation; this favors an understandable schedule over packing.
export function americanoRounds(players: number, courts: number): number {
  return (players - 1) * Math.ceil(players / 4 / courts);
}

export function validateTournament(
  input: TournamentInput,
): TournamentValidationError | null {
  if (!input.name.trim() || input.name.trim().length > 80) return "name";
  if (!tournamentFormats.includes(input.format)) return "format";
  if (!playerCounts.includes(input.players.length)) return "playerCount";
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
  if (input.format === "mexicano" && input.players.length !== input.courts * 4)
    return "mexicanoCourts";
  if (!Number.isInteger(input.points) || input.points < 1 || input.points > 100)
    return "points";
  if (!Number.isInteger(input.rounds) || input.rounds < 1 || input.rounds > 100)
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
