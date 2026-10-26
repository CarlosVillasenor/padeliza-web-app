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
type IndexQuartet = readonly [number, number, number, number];

function pairKey(a: number, b: number): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function quartetKey(ids: IndexQuartet): string {
  return [...ids].sort((a, b) => a - b).join("|");
}

function allQuartets(playerCount: number): IndexQuartet[] {
  const quartets: IndexQuartet[] = [];
  for (let a = 0; a < playerCount - 3; a++)
    for (let b = a + 1; b < playerCount - 2; b++)
      for (let c = b + 1; c < playerCount - 1; c++)
        for (let d = c + 1; d < playerCount; d++)
          quartets.push([a, b, c, d]);
  return quartets;
}

function matchOptions(
  [a, b, c, d]: IndexQuartet,
): readonly IndexMatch[] {
  return [
    [[a, b], [c, d]],
    [[a, c], [b, d]],
    [[a, d], [b, c]],
  ];
}

function pairScore(
  match: IndexMatch,
  partners: ReadonlyMap<string, number>,
  opponents: ReadonlyMap<string, number>,
): number {
  const [[a, b], [c, d]] = match;
  const teammatePairs = [pairKey(a, b), pairKey(c, d)];
  const opponentPairs = [
    pairKey(a, c),
    pairKey(a, d),
    pairKey(b, c),
    pairKey(b, d),
  ];
  return (
    teammatePairs.reduce((score, key) => {
      const count = partners.get(key) ?? 0;
      return score + count * 1000 + count * count;
    }, 0) +
    opponentPairs.reduce((score, key) => {
      const count = opponents.get(key) ?? 0;
      return score + count * count;
    }, 0)
  );
}

function updatePairCounts(
  match: IndexMatch,
  partners: Map<string, number>,
  opponents: Map<string, number>,
  change: 1 | -1,
): void {
  const [[a, b], [c, d]] = match;
  for (const [first, second] of [
    [a, b],
    [c, d],
  ]) {
    const key = pairKey(first, second);
    const count = (partners.get(key) ?? 0) + change;
    if (count === 0) partners.delete(key);
    else partners.set(key, count);
  }
  for (const [first, second] of [
    [a, c],
    [a, d],
    [b, c],
    [b, d],
  ]) {
    const key = pairKey(first, second);
    const count = (opponents.get(key) ?? 0) + change;
    if (count === 0) opponents.delete(key);
    else opponents.set(key, count);
  }
}

function byesFor(matches: readonly Match[], ids: readonly string[]): string[] {
  const playing = new Set(matches.flatMap((match) => [...match.teamA, ...match.teamB]));
  return ids.filter((id) => !playing.has(id));
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
      const matches = pairings
        .slice(start, start + input.courts)
        .map(([a, b], court) => createMatch(number, court + 1, a, b));
      rounds.push({
        number,
        matches,
        byes: byesFor(matches, ids),
      });
    }
  }
  return rounds;
}

function generateBalancedAmericano(input: TournamentInput): Round[] {
  const ids = input.players.map((player) => player.id);
  const quartets = allQuartets(ids.length);
  const usedQuartets = new Set<string>();
  const partners = new Map<string, number>();
  const opponents = new Map<string, number>();
  const appearances = Array.from({ length: ids.length }, () => 0);
  const batchAppearances = Array.from({ length: ids.length }, () => new Map<number, number>());
  const matchesPerRotation = Math.floor(ids.length / 4);
  const byesPerRotation = ids.length % 4;
  const rounds: Round[] = [];

  // Build n rotations with equal match counts per player and unique four-player
  // groups. Partner and opponent counts are balanced heuristically, not perfectly.
  for (let rotation = 0; rotation < ids.length; rotation++) {
    const selectedMatches: IndexMatch[] = [];
    const restOrder = Array.from({ length: ids.length }, (_, player) => player)
      .sort(
        (a, b) =>
          appearances[b] - appearances[a] ||
          (a - rotation + ids.length) % ids.length -
            (b - rotation + ids.length) % ids.length,
      );
    const inRotation = new Set(restOrder.slice(0, byesPerRotation));

    function selectMatches(): boolean {
      if (selectedMatches.length === matchesPerRotation) return true;
      const pivot = Array.from({ length: ids.length }, (_, player) => player).find(
        (player) => !inRotation.has(player),
      );
      if (pivot === undefined) return false;

      const batch = Math.floor(selectedMatches.length / input.courts);
      const candidates = quartets
        .filter(
          (quartet) =>
            quartet.includes(pivot) &&
            !usedQuartets.has(quartetKey(quartet)) &&
            quartet.every((player) => !inRotation.has(player)),
        )
        .map((quartet) => {
          const batchCost = quartet.reduce(
            (score, player) =>
              score + 2 * (batchAppearances[player].get(batch) ?? 0) + 1,
            0,
          );
          const options = matchOptions(quartet)
            .map((match) => ({
              match,
              score: batchCost * 50 + pairScore(match, partners, opponents),
            }))
            .sort((a, b) => a.score - b.score);
          return { quartet, ...options[0] };
        })
        .sort(
          (a, b) =>
            a.score - b.score ||
            quartetKey(a.quartet).localeCompare(quartetKey(b.quartet)),
        );

      for (const { quartet, match } of candidates) {
        const key = quartetKey(quartet);
        usedQuartets.add(key);
        quartet.forEach((player) => inRotation.add(player));
        updatePairCounts(match, partners, opponents, 1);
        for (const player of quartet)
          batchAppearances[player].set(
            batch,
            (batchAppearances[player].get(batch) ?? 0) + 1,
          );
        selectedMatches.push(match);

        if (selectMatches()) return true;

        selectedMatches.pop();
        for (const player of quartet) {
          inRotation.delete(player);
          const count = (batchAppearances[player].get(batch) ?? 0) - 1;
          if (count === 0) batchAppearances[player].delete(batch);
          else batchAppearances[player].set(batch, count);
        }
        updatePairCounts(match, partners, opponents, -1);
        usedQuartets.delete(key);
      }
      return false;
    }

    if (!selectMatches())
      throw new Error(
        `Unable to generate a valid Americano schedule for ${ids.length} players in rotation ${rotation + 1}`,
      );
    for (const match of selectedMatches)
      for (const player of [...match[0], ...match[1]])
        appearances[player] += 1;

    for (let start = 0; start < selectedMatches.length; start += input.courts) {
      const number = rounds.length + 1;
      const matches = selectedMatches
        .slice(start, start + input.courts)
        .map(([[a, b], [c, d]], court) => {
          return createMatch(
            number,
            court + 1,
            [ids[a], ids[b]],
            [ids[c], ids[d]],
          );
        });
      rounds.push({ number, matches, byes: byesFor(matches, ids) });
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
    ? baseRotations[input.players.length]
      ? generateAmericano(input)
      : generateBalancedAmericano(input)
    : [generateFirstRound(input.players, random)];
}
