import type {
  Tournament,
  TournamentError,
} from "../types/tournament.ts";
import {
  canEditScores,
  canFinishTournament,
  canGenerateNextRound,
  statusAfterScore,
} from "./progress.ts";
import { generateNextRound } from "./schedule.ts";
import { isValidScore } from "./scoring.ts";

export type PlayResult =
  | { ok: true; tournament: Tournament }
  | { ok: false; error: TournamentError };

const fail = (error: TournamentError): PlayResult => ({ ok: false, error });

export function recordScore(
  tournament: Tournament,
  matchId: string,
  scoreA: number,
  scoreB: number,
): PlayResult {
  if (tournament.status === "completed") return fail("tournamentCompleted");
  const round = tournament.schedule.find((r) =>
    r.matches.some((m) => m.id === matchId),
  );
  if (!round) return fail("matchNotFound");
  if (!canEditScores(tournament, round.number)) return fail("roundLocked");
  if (!isValidScore(tournament.points, scoreA, scoreB))
    return fail("invalidScore");
  const updated: Tournament = {
    ...tournament,
    schedule: tournament.schedule.map((r) =>
      r.number !== round.number
        ? r
        : {
            ...r,
            matches: r.matches.map((m) =>
              m.id === matchId ? { ...m, scoreA, scoreB } : m,
            ),
          },
    ),
  };
  return { ok: true, tournament: { ...updated, status: statusAfterScore(updated) } };
}

export function addNextRound(tournament: Tournament): PlayResult {
  if (!canGenerateNextRound(tournament)) return fail("cannotGenerateRound");
  return {
    ok: true,
    tournament: {
      ...tournament,
      schedule: [...tournament.schedule, generateNextRound(tournament)],
    },
  };
}

export function completeTournament(tournament: Tournament): PlayResult {
  if (!canFinishTournament(tournament)) return fail("cannotFinish");
  return { ok: true, tournament: { ...tournament, status: "completed" } };
}
