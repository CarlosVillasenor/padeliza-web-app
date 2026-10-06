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
export type Tournament = TournamentInput & {
  id: string;
  createdAt: string;
  status: "scheduled";
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
  | "saveFailed";
