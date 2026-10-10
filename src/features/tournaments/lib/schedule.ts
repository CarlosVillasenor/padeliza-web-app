import type {
  Match,
  Player,
  Round,
  Tournament,
  TournamentInput,
} from "../types/tournament.ts";
import { computeStandings } from "./standings.ts";

type Random = () => number;
type Pair = readonly [string, string];

function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createMatch(
  roundNumber: number,
  court: number,
  teamA: Pair,
  teamB: Pair,
): Match {
  return {
    id: `r${roundNumber}-c${court}`,
    court,
    teamA,
    teamB,
    scoreA: null,
    scoreB: null,
  };
}

type IndexPair = readonly [number, number];
type IndexMatch = readonly [IndexPair, IndexPair];

// Cyclic whist tournament (Moore): for N = q + 1 players with q prime and q % 4 == 3,
// players 0..q-1 plus a fixed player `q` play q rotations. Rotation r is the base
// rotation with every player except the fixed one shifted by r (mod q). Over the
// whole tournament every pair partners exactly once and opposes exactly twice.
// The base rotations were found by exhaustive search and are checked in schedule.test.ts.
const baseRotations: Readonly<Record<number, readonly IndexMatch[]>> = {
  4: [[[0, 1], [2, 3]]],
  8: [
    [[0, 1], [2, 4]],
    [[3, 6], [5, 7]],
  ],
  12: [
    [[0, 5], [1, 2]],
    [[3, 6], [7, 9]],
    [[4, 8], [10, 11]],
  ],
};

// Play each rotation's matches in batches of `courts`.
function generateAmericano(input: TournamentInput): Round[] {
  const ids = input.players.map((p) => p.id);
  const base = baseRotations[ids.length];
  if (!base) throw new Error(`Unsupported Americano size: ${ids.length}`);
  const cycle = ids.length - 1;
  const idAt = (index: number, rotation: number) =>
    ids[index === cycle ? index : (index + rotation) % cycle];
  const rounds: Round[] = [];
  for (let rotation = 0; rotation < cycle; rotation++) {
    const pairings = base.map(([a, b]): [Pair, Pair] => [
      [idAt(a[0], rotation), idAt(a[1], rotation)],
      [idAt(b[0], rotation), idAt(b[1], rotation)],
    ]);
    for (let start = 0; start < pairings.length; start += input.courts) {
      const number = rounds.length + 1;
      rounds.push({
        number,
        matches: pairings
          .slice(start, start + input.courts)
          .map(([a, b], court) => createMatch(number, court + 1, a, b)),
      });
    }
  }
  return rounds;
}

// Within each group of four ranked players the top and bottom seeds team up.
function groupsOfFour(ranked: readonly string[], roundNumber: number): Round {
  const matches: Match[] = [];
  for (let i = 0; i < ranked.length; i += 4) {
    const [first, second, third, fourth] = ranked.slice(i, i + 4);
    matches.push(
      createMatch(
        roundNumber,
        i / 4 + 1,
        [first, fourth],
        [second, third],
      ),
    );
  }
  return { number: roundNumber, matches };
}

export function generateFirstRound(
  players: readonly Player[],
  random: Random = Math.random,
): Round {
  return groupsOfFour(
    shuffle(
      players.map((p) => p.id),
      random,
    ),
    1,
  );
}

export function generateNextRound(tournament: Tournament): Round {
  const ranked = computeStandings(tournament).map((row) => row.playerId);
  return groupsOfFour(ranked, tournament.schedule.length + 1);
}

export function createInitialSchedule(
  input: TournamentInput,
  random: Random = Math.random,
): Round[] {
  return input.format === "americano"
    ? generateAmericano(input)
    : [generateFirstRound(input.players, random)];
}
