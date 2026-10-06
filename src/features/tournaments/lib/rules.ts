import type {
  TournamentInput,
  TournamentValidationError,
} from "../types/tournament.ts";

export const tournamentFormats = ["americano", "mexicano"] as const;
export const playerCounts = [4, 8, 12, 16];

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
