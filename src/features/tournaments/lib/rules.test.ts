import { test } from "node:test";
import assert from "node:assert/strict";
import { americanoRounds, validateTournament } from "./rules.ts";
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
  assert.equal(americanoRounds(12, 2), 22);
});
test("valid input and unsupported or inconsistent configurations", () => {
  assert.equal(validateTournament(input), null);
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
  };
  assert.deepEqual(decodeTournaments(null), []);
  assert.deepEqual(decodeTournaments(encodeTournaments([tournament])), [
    tournament,
  ]);
  for (const raw of [
    "broken",
    "{}",
    '{"version":2,"tournaments":[]}',
    encodeTournaments([tournament, tournament]),
    JSON.stringify({
      version: 1,
      tournaments: [{ ...tournament, players: [null] }],
    }),
    JSON.stringify({
      version: 1,
      tournaments: [{ ...tournament, rounds: 99 }],
    }),
  ])
    assert.throws(() => decodeTournaments(raw));
});
