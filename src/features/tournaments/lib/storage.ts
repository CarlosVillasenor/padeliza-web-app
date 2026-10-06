import type { Tournament } from "../types/tournament.ts";
import { isValidSchedule, validateTournament } from "./rules.ts";

export const STORAGE_KEY = "padeliza.tournaments.v2";
function isTournament(value: unknown): value is Tournament {
  if (!value || typeof value !== "object") return false;
  const t = value as Record<string, unknown>;
  if (
    typeof t.id !== "string" ||
    !t.id ||
    typeof t.createdAt !== "string" ||
    !Number.isFinite(Date.parse(t.createdAt)) ||
    !Array.isArray(t.schedule)
  )
    return false;
  if (
    typeof t.name !== "string" ||
    (t.format !== "americano" && t.format !== "mexicano") ||
    typeof t.courts !== "number" ||
    typeof t.points !== "number" ||
    typeof t.rounds !== "number"
  )
    return false;
  if (
    !Array.isArray(t.players) ||
    !t.players.every(
      (p: unknown) =>
        p !== null &&
        typeof p === "object" &&
        "id" in p &&
        typeof p.id === "string" &&
        "name" in p &&
        typeof p.name === "string",
    )
  )
    return false;
  try {
    return (
      validateTournament(value as Tournament) === null &&
      isValidSchedule(value as Tournament)
    );
  } catch {
    // A malformed schedule can throw while being inspected; treat it as invalid.
    return false;
  }
}
export function decodeTournaments(raw: string | null): Tournament[] {
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("version" in parsed) ||
    parsed.version !== 2 ||
    !("tournaments" in parsed) ||
    !Array.isArray(parsed.tournaments) ||
    !parsed.tournaments.every(isTournament)
  )
    throw new Error("Invalid tournament storage");
  const tournaments = parsed.tournaments;
  if (new Set(tournaments.map((t) => t.id)).size !== tournaments.length)
    throw new Error("Duplicate tournament IDs");
  return tournaments;
}
export function encodeTournaments(tournaments: Tournament[]): string {
  return JSON.stringify({ version: 2, tournaments });
}
