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

// Circle method: each of the N-1 rotations pairs every player exactly once, so
// everyone partners with everyone else once over the whole tournament.
function partnerRotation(ids: readonly string[], rotation: number): Pair[] {
  const [fixed, ...rest] = ids;
  const turned = rest.map((_, i) => rest[(i + rotation) % rest.length]);
  const circle = [fixed, ...turned];
  return Array.from({ length: ids.length / 2 }, (_, i) => [
    circle[i],
    circle[circle.length - 1 - i],
  ]);
}

// Pair up the rotation's teams into matches, then play them in batches of `courts`.
function generateAmericano(input: TournamentInput): Round[] {
  const ids = input.players.map((p) => p.id);
  const rounds: Round[] = [];
  for (let rotation = 0; rotation < ids.length - 1; rotation++) {
    const pairs = partnerRotation(ids, rotation);
    const half = pairs.length / 2;
    const pairings = Array.from({ length: half }, (_, i) => [
      pairs[i],
      pairs[pairs.length - 1 - i],
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

/**
 * Creates the randomized opening Mexicano round.
 * Supply `random` when deterministic player pairings are needed.
 */
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

/**
 * Builds the next Mexicano round from current standings.
 * Callers must ensure the current round is complete before appending it.
 */
export function generateNextRound(tournament: Tournament): Round {
  const ranked = computeStandings(tournament).map((row) => row.playerId);
  return groupsOfFour(ranked, tournament.schedule.length + 1);
}

/**
 * Creates all rounds for Americano, or only the randomized opening round for
 * Mexicano. `random` can be supplied to make the opening round deterministic.
 */
export function createInitialSchedule(
  input: TournamentInput,
  random: Random = Math.random,
): Round[] {
  return input.format === "americano"
    ? generateAmericano(input)
    : [generateFirstRound(input.players, random)];
}
