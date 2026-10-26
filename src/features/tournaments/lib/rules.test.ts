import { test } from "node:test";
import assert from "node:assert/strict";
import {
  americanoRounds,
  maxPlayers,
  maxAmericanoRounds,
  validateTournament,
} from "./rules.ts";
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
  for (const n of [4, 8, 12]) {
    assert.equal(americanoRounds(n, n / 4), n - 1);
    assert.equal(americanoRounds(n, 1), (n * (n - 1)) / 4);
  }
  assert.equal(americanoRounds(12, 2), 22);
  assert.equal(americanoRounds(5, 1), 5);
  assert.equal(americanoRounds(9, 2), 9);
  assert.equal(americanoRounds(maxPlayers, 1), maxAmericanoRounds);
});
test("valid input and unsupported or inconsistent configurations", () => {
  assert.equal(validateTournament(input), null);
  const sixteen = Array.from({ length: 16 }, (_, i) => ({
    id: String(i),
    name: `J${i}`,
  }));
  assert.equal(
    validateTournament({
      ...input,
      players: sixteen,
      courts: 4,
      rounds: americanoRounds(16, 4),
    }),
    null,
  );
  assert.equal(
    validateTournament({
      ...input,
      players: Array.from({ length: maxPlayers + 1 }, (_, i) => ({
        id: String(i),
        name: `J${i}`,
      })),
    }),
    "playerCount",
  );
  const maxSize = Array.from({ length: maxPlayers }, (_, i) => ({
    id: String(i),
    name: `J${i}`,
  }));
  assert.equal(
    validateTournament({
      ...input,
      players: maxSize,
      courts: 4,
      rounds: americanoRounds(maxPlayers, 4),
    }),
    null,
  );
  assert.equal(
    validateTournament({
      ...input,
      players: input.players.slice(0, 3),
    }),
    "playerCount",
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
  assert.equal(
    validateTournament({
      ...input,
      format: "mexicano",
      players: [...eight, { id: "8", name: "J8" }],
      courts: 2,
    }),
    "mexicanoCourts",
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
  const legacyTournament: Tournament = {
    ...tournament,
    schedule: tournament.schedule.map(({ number, matches }) => ({
      number,
      matches,
    })),
  };
  assert.deepEqual(
    decodeTournaments(encodeTournaments([legacyTournament])),
    [legacyTournament],
  );
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
});
