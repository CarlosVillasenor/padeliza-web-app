import { test } from "node:test";
import assert from "node:assert/strict";
import { americanoRounds, validateTournament } from "./rules.ts";
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

test("americano 5 players: creates five rounds with one bye per player", () => {
  const input = americanoInput(5, 1);
  assert.equal(validateTournament(input), null);
  const schedule = createInitialSchedule(input);
  const appearances = new Map(input.players.map(({ id }) => [id, 0]));
  const rests = new Map(input.players.map(({ id }) => [id, 0]));
  const partners = new Map<string, number>();
  const opponents = new Map<string, number>();

  assert.equal(schedule.length, 5);
  assert.equal(
    schedule.reduce((total, round) => total + round.matches.length, 0),
    5,
  );
  schedule.forEach((round, index) => {
    assert.equal(round.number, index + 1);
    assert.equal(round.matches.length, 1);
    const match = round.matches[0];
    const participants = [...match.teamA, ...match.teamB];
    assert.equal(new Set(participants).size, 4);
    assert.ok(participants.every((id) => appearances.has(id)));
    participants.forEach((id) => appearances.set(id, appearances.get(id)! + 1));
    const restingPlayer = input.players.find(
      ({ id }) => !participants.includes(id),
    );
    assert.ok(restingPlayer);
    rests.set(restingPlayer.id, rests.get(restingPlayer.id)! + 1);

    for (const team of [match.teamA, match.teamB]) {
      const key = pairKey(team[0], team[1]);
      partners.set(key, (partners.get(key) ?? 0) + 1);
    }
    for (const a of match.teamA)
      for (const b of match.teamB) {
        const key = pairKey(a, b);
        opponents.set(key, (opponents.get(key) ?? 0) + 1);
      }
  });

  assert.ok([...appearances.values()].every((count) => count === 4));
  assert.ok([...rests.values()].every((count) => count === 1));
  assert.equal(partners.size, 10);
  assert.ok([...partners.values()].every((count) => count === 1));
  assert.equal(opponents.size, 10);
  assert.ok([...opponents.values()].every((count) => count === 2));
});

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

for (const playerCount of [
  6, 7, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
]) {
  for (const courts of new Set([1, Math.floor(playerCount / 4)])) {
    test(`americano ${playerCount} players, ${courts} court(s): balanced valid schedule without repeated partners`, () => {
      const input = americanoInput(playerCount, courts);
      assert.equal(validateTournament(input), null);
      const schedule = createInitialSchedule(input);
      const appearances = new Map(input.players.map(({ id }) => [id, 0]));
      const partners = new Map<string, number>();
      const opponents = new Map<string, number>();

      assert.equal(schedule.length, americanoRounds(playerCount, courts));
      assert.equal(
        schedule.reduce((total, round) => total + round.matches.length, 0),
        (playerCount % 2 === 0 ? playerCount - 1 : playerCount) *
          Math.floor(playerCount / 4),
      );
      schedule.forEach((round, index) => {
        assert.equal(round.number, index + 1);
        assert.ok(round.matches.length > 0 && round.matches.length <= courts);
        const playersInRound: string[] = [];
        for (const match of round.matches) {
          const participants = [...match.teamA, ...match.teamB];
          assert.equal(new Set(participants).size, 4);
          assert.ok(participants.every((id) => appearances.has(id)));
          playersInRound.push(...participants);
          participants.forEach((id) =>
            appearances.set(id, appearances.get(id)! + 1),
          );

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
        assert.equal(new Set(playersInRound).size, playersInRound.length);
      });

      const appearanceCounts = [...appearances.values()];
      const totalAppearances = (playerCount % 2 === 0
        ? playerCount - 1
        : playerCount) *
        Math.floor(playerCount / 4) *
        4;
      const minimum = Math.floor(totalAppearances / playerCount);
      const maximum = Math.ceil(totalAppearances / playerCount);
      assert.ok(
        appearanceCounts.every(
          (count) => count >= minimum && count <= maximum,
        ),
      );
      assert.equal(
        Math.max(...appearanceCounts) - Math.min(...appearanceCounts),
        maximum - minimum,
      );
      assert.equal(
        partners.size,
        schedule.reduce(
          (total, round) => total + round.matches.length * 2,
          0,
        ),
      );
      assert.ok([...partners.values()].every((count) => count === 1));
      assert.equal(
        [...opponents.values()].reduce((total, count) => total + count, 0),
        schedule.reduce(
          (total, round) => total + round.matches.length * 4,
          0,
        ),
      );
    });
  }
}
