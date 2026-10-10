export type TournamentFormat = "americano" | "mexicano";
export type Player = { id: string; name: string };
export type TournamentInput = {
  name: string;
  format: TournamentFormat;
  players: Player[];
  courts: number;
  points: number;
  rounds: number;
};
export type TournamentStatus = "scheduled" | "in-progress" | "completed";
export type Team = readonly [string, string];
// A score is either unset (both null) or a full result whose total is `points`.
export type Match = {
  id: string;
  court: number;
  teamA: Team;
  teamB: Team;
  scoreA: number | null;
  scoreB: number | null;
};
export type Round = { number: number; matches: Match[] };
export type Tournament = TournamentInput & {
  id: string;
  createdAt: string;
  status: TournamentStatus;
  // Americano stores every round up front; Mexicano appends one round at a time.
  schedule: Round[];
};
export type StandingRow = {
  playerId: string;
  name: string;
  points: number;
  wins: number;
  position: number;
};

export type TournamentValidationError =
  | "name"
  | "format"
  | "playerCount"
  | "playerName"
  | "duplicatePlayerName"
  | "duplicatePlayerId"
  | "courts"
  | "mexicanoCourts"
  | "points"
  | "rounds"
  | "roundsMismatch";
// Domain failures are codes, not text, so the UI language stays a view concern.
export type TournamentError =
  | TournamentValidationError
  | "storageUnavailable"
  | "storageNotReady"
  | "saveFailed"
  | "tournamentNotFound"
  | "tournamentCompleted"
  | "matchNotFound"
  | "roundLocked"
  | "invalidScore"
  | "cannotGenerateRound"
  | "cannotFinish";
