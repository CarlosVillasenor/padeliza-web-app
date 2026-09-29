import type { TournamentInput } from "../types/tournament.ts";

export const formatNames = {
  americano: "Americano clásico",
  mexicano: "Mexicano clásico",
};
export const playerCounts = [4, 8, 12, 16];

// Each complete partner rotation has N/4 matches. Finish its batches before
// starting the next rotation; this favors an understandable schedule over packing.
export function americanoRounds(players: number, courts: number): number {
  return (players - 1) * Math.ceil(players / 4 / courts);
}

export function validateTournament(input: TournamentInput): string | null {
  if (!input.name.trim() || input.name.trim().length > 80)
    return "Escribe un nombre de hasta 80 caracteres.";
  if (!(input.format in formatNames))
    return "Selecciona un tipo de torneo válido.";
  if (!playerCounts.includes(input.players.length))
    return "Agrega 4, 8, 12 o 16 jugadores.";
  const names = input.players.map((player) =>
    player.name.trim().toLocaleLowerCase("es"),
  );
  if (names.some((name) => !name || name.length > 50))
    return "Cada jugador necesita un nombre de hasta 50 caracteres.";
  if (new Set(names).size !== names.length)
    return "Los nombres de los jugadores deben ser distintos.";
  if (
    input.players.some((p) => !p.id) ||
    new Set(input.players.map((p) => p.id)).size !== names.length
  )
    return "Los identificadores de jugadores deben ser únicos.";
  if (
    !Number.isInteger(input.courts) ||
    input.courts < 1 ||
    input.courts > input.players.length / 4
  )
    return "Selecciona una cantidad válida de pistas.";
  if (input.format === "mexicano" && input.players.length !== input.courts * 4)
    return "Mexicano necesita cuatro jugadores por pista.";
  if (!Number.isInteger(input.points) || input.points < 1 || input.points > 100)
    return "Elige entre 1 y 100 puntos totales por partido.";
  if (!Number.isInteger(input.rounds) || input.rounds < 1 || input.rounds > 100)
    return "Elige entre 1 y 100 rondas.";
  if (
    input.format === "americano" &&
    input.rounds !== americanoRounds(input.players.length, input.courts)
  )
    return "El número de rondas no corresponde a la configuración.";
  return null;
}
