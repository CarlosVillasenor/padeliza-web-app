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

function fivePlayerPairings(): IndexMatch[] {
  const playerCount = 5;
  const allPairs = new Set<string>();
  for (let a = 0; a < playerCount; a++)
    for (let b = a + 1; b < playerCount; b++) allPairs.add(`${a}|${b}`);

  const candidatesByBye = Array.from({ length: playerCount }, (_, bye) => {
    const available = Array.from(
      { length: playerCount },
      (_, player) => player,
    ).filter((player) => player !== bye);
    const candidates: IndexMatch[] = [];
    for (let i = 0; i < available.length; i++)
      for (let j = i + 1; j < available.length; j++) {
        const teamA: IndexPair = [available[i], available[j]];
        const remaining = available.filter(
          (player) => player !== teamA[0] && player !== teamA[1],
        );
        if (teamA[0] > remaining[0]) continue;
        candidates.push([teamA, [remaining[0], remaining[1]]]);
      }
    return candidates;
  });
  // There are only three team splits for each bye, so exhaustive search is small.
  const partners = new Set<string>();
  const opponents = new Map<string, number>();

  function search(bye: number, chosen: IndexMatch[]): IndexMatch[] | null {
    if (bye === playerCount) {
      return partners.size === allPairs.size &&
        opponents.size === allPairs.size &&
        [...opponents.values()].every((count) => count === 2)
        ? chosen
        : null;
    }

    for (const matchup of candidatesByBye[bye]) {
      const [teamA, teamB] = matchup;
      const teamPairs = [
        `${teamA[0]}|${teamA[1]}`,
        `${teamB[0]}|${teamB[1]}`,
      ];
      if (teamPairs.some((pair) => partners.has(pair))) continue;

      const opponentPairs = teamA.flatMap((a) =>
        teamB.map((b) => `${Math.min(a, b)}|${Math.max(a, b)}`),
      );
      if (opponentPairs.some((pair) => (opponents.get(pair) ?? 0) >= 2))
        continue;

      teamPairs.forEach((pair) => partners.add(pair));
      opponentPairs.forEach((pair) =>
        opponents.set(pair, (opponents.get(pair) ?? 0) + 1),
      );
      const result = search(bye + 1, [...chosen, matchup]);
      if (result) return result;
      teamPairs.forEach((pair) => partners.delete(pair));
      opponentPairs.forEach((pair) => {
        const count = opponents.get(pair)! - 1;
        if (count === 0) opponents.delete(pair);
        else opponents.set(pair, count);
      });
    }
    return null;
  }

  const pairings = search(0, []);
  if (!pairings) throw new Error("Unable to generate a five-player Americano");
  return pairings;
}

function generateFivePlayerAmericano(ids: readonly string[]): Round[] {
  return fivePlayerPairings().map(([teamA, teamB], index) => {
    const number = index + 1;
    return {
      number,
      matches: [
        createMatch(
          number,
          1,
          [ids[teamA[0]], ids[teamA[1]]],
          [ids[teamB[0]], ids[teamB[1]]],
        ),
      ],
    };
  });
}

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
  if (ids.length === 5) return generateFivePlayerAmericano(ids);
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
