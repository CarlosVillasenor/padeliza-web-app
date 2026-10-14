import { test } from "node:test";
import assert from "node:assert/strict";
import { americanoRounds } from "./rules.ts";
import { createInitialSchedule } from "./schedule.ts";
import type { Player, TournamentInput } from "../types/tournament.ts";

function americanoInput(playerCount: number, courts: number): TournamentInput {
  const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
    id: `p${i}`,
    name: `Jugador ${i}`,
  }));
  return {
    name: "Prueba",
    format: "americano",
    players,
    courts,
    points: 16,
    rounds: americanoRounds(playerCount, courts),
  };
}

const pairKey = (a: string, b: string) => [a, b].sort().join("|");

for (const playerCount of [4, 8, 12]) {
  for (const courts of [1, playerCount / 4]) {
    test(`americano ${playerCount} players, ${courts} court(s): schedule shape`, () => {
      const input = americanoInput(playerCount, courts);
      const schedule = createInitialSchedule(input);

      assert.equal(schedule.length, americanoRounds(playerCount, courts));
      schedule.forEach((round, index) => {
        assert.equal(round.number, index + 1);
        assert.ok(round.matches.length >= 1 && round.matches.length <= courts);
        const playersInRound = round.matches.flatMap((m) => [...m.teamA, ...m.teamB]);
        assert.equal(new Set(playersInRound).size, playersInRound.length);
      });
    });

    test(`americano ${playerCount} players, ${courts} court(s): everyone partners everyone once`, () => {
      const schedule = createInitialSchedule(americanoInput(playerCount, courts));
      const partners = new Map<string, number>();
      for (const round of schedule)
        for (const match of round.matches)
          for (const team of [match.teamA, match.teamB]) {
            const key = pairKey(team[0], team[1]);
            partners.set(key, (partners.get(key) ?? 0) + 1);
          }

      assert.equal(partners.size, (playerCount * (playerCount - 1)) / 2);
      assert.ok([...partners.values()].every((count) => count === 1));
    });

    test(`americano ${playerCount} players, ${courts} court(s): everyone opposes everyone twice`, () => {
      const schedule = createInitialSchedule(americanoInput(playerCount, courts));
      const opponents = new Map<string, number>();
      for (const round of schedule)
        for (const match of round.matches)
          for (const a of match.teamA)
            for (const b of match.teamB) {
              const key = pairKey(a, b);
              opponents.set(key, (opponents.get(key) ?? 0) + 1);
            }

      assert.equal(opponents.size, (playerCount * (playerCount - 1)) / 2);
      assert.ok([...opponents.values()].every((count) => count === 2));
    });
  }
}
