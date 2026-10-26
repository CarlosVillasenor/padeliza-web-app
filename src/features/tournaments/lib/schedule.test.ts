import { test } from "node:test";
import assert from "node:assert/strict";
import {
  americanoMatchesPerPlayer,
  americanoRounds,
  maxPlayers,
} from "./rules.ts";
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

test("all supported counts schedule valid, unique matches and fair appearances", () => {
  for (let playerCount = 4; playerCount <= maxPlayers; playerCount++) {
    const maxCourts = Math.min(4, Math.floor(playerCount / 4));
    for (const courts of new Set([1, maxCourts])) {
      const input = americanoInput(playerCount, courts);
      const schedule = createInitialSchedule(input);
      const appearances = new Map(input.players.map((player) => [player.id, 0]));
      const byeCounts = new Map(input.players.map((player) => [player.id, 0]));
      const matchGroups = new Set<string>();

      assert.equal(schedule.length, americanoRounds(playerCount, courts));
      schedule.forEach((round, index) => {
        assert.equal(round.number, index + 1);
        assert.ok(round.matches.length >= 1 && round.matches.length <= courts);
        const playing = new Set<string>();

        for (const match of round.matches) {
          const participants = [...match.teamA, ...match.teamB];
          assert.equal(participants.length, 4);
          assert.equal(new Set(participants).size, 4);
          assert.ok(participants.every((id) => appearances.has(id)));
          assert.ok(match.court >= 1 && match.court <= courts);
          for (const id of participants) {
            assert.ok(!playing.has(id));
            playing.add(id);
            appearances.set(id, appearances.get(id)! + 1);
          }

          const groupKey = [...participants].sort().join("|");
          if (![4, 8, 12].includes(playerCount)) {
            assert.ok(!matchGroups.has(groupKey), `duplicate match group ${groupKey}`);
            matchGroups.add(groupKey);
          }
        }

        assert.deepEqual(
          round.byes,
          input.players
            .filter((player) => !playing.has(player.id))
            .map((player) => player.id),
        );
        assert.equal(round.byes?.length, playerCount - playing.size);
        for (const id of round.byes ?? [])
          byeCounts.set(id, byeCounts.get(id)! + 1);
      });

      assert.ok(
        [...appearances.values()].every(
          (count) => count === americanoMatchesPerPlayer(playerCount),
        ),
        `uneven appearances for ${playerCount} players on ${courts} court(s)`,
      );
      assert.ok(
        [...byeCounts.values()].every(
          (count) => count === schedule.length - americanoMatchesPerPlayer(playerCount),
        ),
        `uneven rests for ${playerCount} players on ${courts} court(s)`,
      );
    }
  }
});

for (const playerCount of [4, 8, 12]) {
  for (const courts of [1, playerCount / 4]) {
    test(`classic Americano ${playerCount} players, ${courts} court(s): exact partner rotation`, () => {
      const schedule = createInitialSchedule(americanoInput(playerCount, courts));
      const partners = new Map<string, number>();
      const opponents = new Map<string, number>();

      for (const round of schedule)
        for (const match of round.matches) {
          for (const team of [match.teamA, match.teamB]) {
            const key = pairKey(team[0], team[1]);
            partners.set(key, (partners.get(key) ?? 0) + 1);
          }
          for (const a of match.teamA)
            for (const b of match.teamB) {
              const key = pairKey(a, b);
              opponents.set(key, (opponents.get(key) ?? 0) + 1);
            }
        }

      assert.equal(partners.size, (playerCount * (playerCount - 1)) / 2);
      assert.ok([...partners.values()].every((count) => count === 1));
      assert.equal(opponents.size, (playerCount * (playerCount - 1)) / 2);
      assert.ok([...opponents.values()].every((count) => count === 2));
    });
  }
}
