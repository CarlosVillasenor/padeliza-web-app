import { test } from "node:test";
import assert from "node:assert/strict";
import { americanoRounds, validateTournament } from "./rules.ts";
import { createInitialSchedule } from "./schedule.ts";
import { decodeTournaments, encodeTournaments } from "./storage.ts";
import type { TournamentInput, Tournament } from "../types/tournament.ts";
const input: TournamentInput = {
  name: "Domingo",
  format: "americano",
  players: Array.from({ length: 4 }, (_, i) => ({
    id: String(i),
    name: `Jugador ${i}`,
  })),
  courts: 1,
  points: 16,
  rounds: 3,
};
test("complete rotations and sequential court batches", () => {
  for (const n of [4, 8, 12, 16]) {
    assert.equal(americanoRounds(n, n / 4), n - 1);
    assert.equal(americanoRounds(n, 1), (n * (n - 1)) / 4);
  }
  assert.equal(americanoRounds(5, 1), 5);
  assert.equal(americanoRounds(12, 2), 22);
  assert.equal(americanoRounds(9, 2), 9);
  assert.equal(americanoRounds(24, 1), 138);
});
test("valid input and unsupported or inconsistent configurations", () => {
  assert.equal(validateTournament(input), null);
  for (let playerCount = 4; playerCount <= 24; playerCount++) {
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: `range-${playerCount}-${i}`,
      name: `Jugador ${i}`,
    }));
    const courts = Math.floor(playerCount / 4);
    assert.equal(
      validateTournament({
        ...input,
        players,
        courts,
        rounds: americanoRounds(playerCount, courts),
      }),
      null,
    );
  }
  const five: TournamentInput = {
    ...input,
    players: Array.from({ length: 5 }, (_, i) => ({
      id: `five-${i}`,
      name: `Jugador ${i}`,
    })),
    rounds: americanoRounds(5, 1),
  };
  assert.equal(validateTournament(five), null);
  assert.equal(
    validateTournament({ ...five, format: "mexicano" }),
    "mexicanoCourts",
  );
  const sixteen: TournamentInput = {
    ...input,
    players: Array.from({ length: 16 }, (_, i) => ({
      id: String(i),
      name: `J${i}`,
    })),
    courts: 4,
    rounds: americanoRounds(16, 4),
  };
  assert.equal(validateTournament(sixteen), null);
  assert.equal(
    validateTournament({
      ...sixteen,
      format: "mexicano",
      courts: 4,
      rounds: 10,
    }),
    "mexicanoCourts",
  );
  assert.equal(
    validateTournament({
      ...input,
      players: Array.from({ length: 3 }, (_, i) => ({
        id: String(i),
        name: `J${i}`,
      })),
    }),
    "playerCount",
  );
  assert.equal(
    validateTournament({
      ...input,
      players: Array.from({ length: 25 }, (_, i) => ({
        id: String(i),
        name: `J${i}`,
      })),
      rounds: 200,
    }),
    "playerCount",
  );
  assert.equal(
    validateTournament({ ...five, courts: 2 }),
    "courts",
  );
  for (const change of [
    { players: [] },
    { courts: 2 },
    { points: 0 },
    { points: 1.5 },
    { rounds: 4 },
    { name: " " },
  ])
    assert.ok(validateTournament({ ...input, ...change }));
  assert.ok(
    validateTournament({
      ...input,
      players: input.players.map((p) => ({ ...p, name: " Ana " })),
    }),
  );
  assert.equal(
    validateTournament({ ...input, format: "mexicano", rounds: 7 }),
    null,
  );
  const eight = Array.from({ length: 8 }, (_, i) => ({
    id: String(i),
    name: `J${i}`,
  }));
  assert.ok(
    validateTournament({
      ...input,
      format: "mexicano",
      players: eight,
      courts: 1,
    }),
  );
  assert.equal(
    validateTournament({
      ...input,
      format: "mexicano",
      players: eight,
      courts: 2,
    }),
    null,
  );
});
test("storage round trip, empty, corrupted, unsupported versions and duplicates", () => {
  const tournament: Tournament = {
    ...input,
    id: "t1",
    createdAt: new Date().toISOString(),
    status: "scheduled",
    schedule: createInitialSchedule(input),
  };
  assert.deepEqual(decodeTournaments(null), []);
  assert.deepEqual(decodeTournaments(encodeTournaments([tournament])), [
    tournament,
  ]);
  for (const raw of [
    "broken",
    "{}",
    '{"version":1,"tournaments":[]}',
    encodeTournaments([tournament, tournament]),
    JSON.stringify({
      version: 2,
      tournaments: [{ ...tournament, players: [null] }],
    }),
    JSON.stringify({
      version: 2,
      tournaments: [{ ...tournament, rounds: 99 }],
    }),
  ])
    assert.throws(() => decodeTournaments(raw));

  const ninePlayerInput = {
    ...input,
    players: Array.from({ length: 9 }, (_, i) => ({
      id: `nine-${i}`,
      name: `Jugador ${i}`,
    })),
    courts: 2,
    rounds: americanoRounds(9, 2),
  };
  const ninePlayerTournament: Tournament = {
    ...ninePlayerInput,
    id: "nine-player",
    createdAt: new Date().toISOString(),
    status: "scheduled",
    schedule: createInitialSchedule(ninePlayerInput),
  };
  assert.deepEqual(
    decodeTournaments(encodeTournaments([ninePlayerTournament])),
    [ninePlayerTournament],
  );
});
