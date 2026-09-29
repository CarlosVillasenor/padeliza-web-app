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
