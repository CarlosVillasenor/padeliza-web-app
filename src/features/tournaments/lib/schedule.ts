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

function circlePairingRounds(playerCount: number): IndexPair[][] {
  const dummy = playerCount % 2 === 0 ? null : playerCount;
  let players = Array.from(
    { length: playerCount + (dummy === null ? 0 : 1) },
    (_, index) => index,
  );
  const rounds: IndexPair[][] = [];

  for (let round = 0; round < players.length - 1; round++) {
    const pairings: IndexPair[] = [];
    for (let index = 0; index < players.length / 2; index++) {
      const first = players[index];
      const second = players[players.length - 1 - index];
      if (first !== dummy && second !== dummy)
        pairings.push([first, second]);
    }
    rounds.push(pairings);
    players = [
      players[0],
      players[players.length - 1],
      ...players.slice(1, -1),
    ];
  }
  return rounds;
}

function chooseBalancedRestPairings(
  rotations: readonly IndexPair[][],
  playerCount: number,
  remainder: number,
): IndexPair[] {
  const minimum = remainder === 2 ? 1 : 2;
  const maximum = 2;
  const absences = Array<number>(playerCount).fill(0);
  const chosen: IndexPair[] = [];
  const deadStates = new Set<string>();

  function search(rotation: number): boolean {
    if (rotation === rotations.length)
      return absences.every((count) => count >= minimum && count <= maximum);
    const state = `${rotation}:${absences.join(",")}`;
    if (deadStates.has(state)) return false;

    const remainingRotations = rotations.length - rotation;
    const requiredAbsences = absences.reduce(
      (total, count) => total + Math.max(0, minimum - count),
      0,
    );
    if (
      requiredAbsences > remainingRotations * 2 ||
      absences.some((count) => count + remainingRotations < minimum)
    )
      return false;

    const candidates = [...rotations[rotation]].sort(
      ([a, b], [c, d]) =>
        absences[a] +
        absences[b] -
        absences[c] -
        absences[d],
    );
    for (const pairing of candidates) {
      const [first, second] = pairing;
      if (absences[first] >= maximum || absences[second] >= maximum) continue;
      absences[first]++;
      absences[second]++;
      chosen.push(pairing);
      if (search(rotation + 1)) return true;
      chosen.pop();
      absences[first]--;
      absences[second]--;
    }
    deadStates.add(state);
    return false;
  }

  if (search(0)) return chosen;

  absences.fill(0);
  return rotations.map((pairings) => {
    const [first, second] = [...pairings].sort(
      ([a, b], [c, d]) =>
        absences[a] +
        absences[b] -
        absences[c] -
        absences[d],
    )[0];
    absences[first]++;
    absences[second]++;
    return pairings.find(
      ([a, b]) =>
        (a === first && b === second) || (a === second && b === first),
    )!;
  });
}

function orderMatchesForBalancedRounds(
  matches: readonly IndexMatch[],
  courts: number,
  appearances: readonly number[],
  rotation: number,
): IndexMatch[] {
  const candidates = [
    ...matches.slice(rotation % matches.length),
    ...matches.slice(0, rotation % matches.length),
  ];
  const selected: IndexMatch[] = [];
  const used = Array<boolean>(candidates.length).fill(false);
  let bestScore = Number.POSITIVE_INFINITY;
  let bestOrder: IndexMatch[] = [...candidates];

  function evaluate(): void {
    const counts = [...appearances];
    let score = 0;
    for (let start = 0; start < selected.length; start += courts) {
      for (const match of selected.slice(start, start + courts))
        for (const player of match.flat()) counts[player]++;
      score += counts.reduce((total, count) => total + count * count, 0);
    }
    if (score < bestScore) {
      bestScore = score;
      bestOrder = [...selected];
    }
  }

  function visit(): void {
    if (selected.length === candidates.length) {
      evaluate();
      return;
    }
    for (let index = 0; index < candidates.length; index++) {
      if (used[index]) continue;
      used[index] = true;
      selected.push(candidates[index]);
      visit();
      selected.pop();
      used[index] = false;
    }
  }

  visit();
  return bestOrder;
}

function groupPartnersIntoMatches(
  pairings: readonly IndexPair[],
  opponents: Map<string, number>,
): IndexMatch[] {
  const cost = (first: IndexPair, second: IndexPair) =>
    first.reduce(
      (total, a) =>
        total +
        second.reduce(
          (subtotal, b) =>
            subtotal + (opponents.get(`${Math.min(a, b)}|${Math.max(a, b)}`) ?? 0),
          0,
        ),
      0,
    );
  const memo = new Map<number, { cost: number; groups: IndexMatch[] }>();

  function findBest(mask: number): { cost: number; groups: IndexMatch[] } {
    if (mask === 0) return { cost: 0, groups: [] };
    const cached = memo.get(mask);
    if (cached) return cached;

    let first = 0;
    while ((mask & (1 << first)) === 0) first++;
    const withoutFirst = mask & ~(1 << first);
    let best: { cost: number; groups: IndexMatch[] } | undefined;
    for (let second = first + 1; second < pairings.length; second++) {
      if ((withoutFirst & (1 << second)) === 0) continue;
      const remainder = findBest(withoutFirst & ~(1 << second));
      const candidate = {
        cost: cost(pairings[first], pairings[second]) + remainder.cost,
        groups: [
          [pairings[first], pairings[second]] as IndexMatch,
          ...remainder.groups,
        ],
      };
      if (!best || candidate.cost < best.cost) best = candidate;
    }
    if (!best) throw new Error("Unable to pair Americano teams into matches");
    memo.set(mask, best);
    return best;
  }

  const groups = findBest((1 << pairings.length) - 1).groups;
  for (const [teamA, teamB] of groups)
    for (const a of teamA)
      for (const b of teamB) {
        const key = `${Math.min(a, b)}|${Math.max(a, b)}`;
        opponents.set(key, (opponents.get(key) ?? 0) + 1);
      }
  return groups;
}

// General schedules use each teammate pair at most once and balance played
// matches to within one per player. Opponents are minimized per rotation, but
// their total repeat counts are not guaranteed to be uniform.
function generateGeneralAmericano(input: TournamentInput): Round[] {
  const ids = input.players.map((player) => player.id);
  const actualAppearances = Array<number>(ids.length).fill(0);
  const opponents = new Map<string, number>();
  const rounds: Round[] = [];
  const rotations = circlePairingRounds(ids.length);
  const remainder = ids.length % 4;
  const removedPairings =
    remainder === 2 || remainder === 3
      ? chooseBalancedRestPairings(rotations, ids.length, remainder)
      : [];

  rotations.forEach((rotationPairings, rotationIndex) => {
    const pairings = rotationPairings.filter(
      (pairing) => pairing !== removedPairings[rotationIndex],
    );
    const matches = groupPartnersIntoMatches(pairings, opponents);
    const orderedMatches = orderMatchesForBalancedRounds(
      matches,
      input.courts,
      actualAppearances,
      rotationIndex,
    );

    for (
      let start = 0;
      start < orderedMatches.length;
      start += input.courts
    ) {
      const batch = orderedMatches.slice(start, start + input.courts);
      const number = rounds.length + 1;
      rounds.push({
        number,
        matches: batch.map(([teamA, teamB], court) =>
          createMatch(
            number,
            court + 1,
            [ids[teamA[0]], ids[teamA[1]]],
            [ids[teamB[0]], ids[teamB[1]]],
          ),
        ),
      });
      batch.forEach((match) =>
        match.flat().forEach((player) => actualAppearances[player]++),
      );
    }
  });
  return rounds;
}

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
  if (!base) return generateGeneralAmericano(input);
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
