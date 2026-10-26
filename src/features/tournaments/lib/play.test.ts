import { test } from "node:test";
import assert from "node:assert/strict";
import type { Tournament, TournamentInput } from "../types/tournament.ts";
import { americanoRounds } from "./rules.ts";
import { createInitialSchedule } from "./schedule.ts";
import { isValidScore, scoresFromSelection } from "./scoring.ts";
import {
  canEditScores,
  canFinishTournament,
  canGenerateNextRound,
  pendingMatches,
} from "./progress.ts";
import { addNextRound, completeTournament, recordScore } from "./play.ts";
import { computeStandings } from "./standings.ts";
import { decodeTournaments, encodeTournaments } from "./storage.ts";

function build(
  players: number,
  courts: number,
  format: TournamentInput["format"] = "americano",
  rounds = 3,
): Tournament {
  const input: TournamentInput = {
    name: "T",
    format,
    players: Array.from({ length: players }, (_, i) => ({
      id: `p${i}`,
      name: `J${i}`,
    })),
    courts,
    points: 16,
    rounds: format === "americano" ? americanoRounds(players, courts) : rounds,
  };
  return {
    ...input,
    id: "t",
    createdAt: new Date().toISOString(),
    status: "scheduled",
    schedule: createInitialSchedule(input),
  };
}

test("score rules: total must equal points", () => {
  assert.ok(isValidScore(16, 10, 6));
  assert.ok(!isValidScore(16, 10, 7));
  assert.ok(!isValidScore(16, -1, 17));
  assert.ok(!isValidScore(16, 1.5, 14.5));
  assert.deepEqual(scoresFromSelection(16, "b", 10), { scoreA: 6, scoreB: 10 });
});

test("americano schedule matches the round count and repeats no partner", () => {
  for (const [players, courts] of [
    [4, 1],
    [8, 1],
    [8, 2],
    [12, 2],
    [12, 3],
  ]) {
    const t = build(players, courts);
    assert.equal(t.schedule.length, americanoRounds(players, courts));
    const partners = new Set<string>();
    for (const round of t.schedule) {
      assert.ok(round.matches.length <= courts);
      const seen = new Set<string>();
      for (const m of round.matches)
        for (const team of [m.teamA, m.teamB]) {
          team.forEach((id) => {
            assert.ok(!seen.has(id));
            seen.add(id);
          });
          partners.add([...team].sort().join("|"));
        }
    }
    assert.equal(partners.size, (players * (players - 1)) / 2);
  }
});

test("scores update status, standings and block finishing until complete", () => {
  let t = build(4, 1);
  assert.equal(pendingMatches(t), 3);
  assert.ok(!canFinishTournament(t));
  const first = t.schedule[0].matches[0];
  const result = recordScore(t, first.id, 10, 6);
  assert.ok(result.ok);
  t = result.tournament;
  assert.equal(t.status, "in-progress");
  assert.equal(computeStandings(t)[0].points, 10);
  const invalid = recordScore(t, first.id, 10, 7);
  assert.ok(!invalid.ok && invalid.error === "invalidScore");
  assert.ok(!completeTournament(t).ok);
  for (const round of t.schedule.slice(1)) {
    const r = recordScore(t, round.matches[0].id, 8, 8);
    assert.ok(r.ok);
    t = r.tournament;
  }
  const done = completeTournament(t);
  assert.ok(done.ok);
  assert.equal(done.tournament.status, "completed");
  assert.ok(!canEditScores(done.tournament, 1));
  const edit = recordScore(done.tournament, first.id, 9, 7);
  assert.ok(!edit.ok && edit.error === "tournamentCompleted");
  assert.deepEqual(decodeTournaments(encodeTournaments([done.tournament])), [
    done.tournament,
  ]);
});

test("Americano byes are not matches and never earn standings points", () => {
  for (let playerCount = 4; playerCount <= 20; playerCount++) {
    let tournament = build(
      playerCount,
      Math.min(4, Math.floor(playerCount / 4)),
    );
    const expected = new Map(
      tournament.players.map((player) => [player.id, { points: 0, wins: 0 }]),
    );
    const matchCount = tournament.schedule.reduce(
      (total, round) => total + round.matches.length,
      0,
    );
    assert.equal(pendingMatches(tournament), matchCount);

    for (const round of tournament.schedule)
      for (const match of round.matches) {
        const result = recordScore(tournament, match.id, 10, 6);
        assert.ok(result.ok);
        tournament = result.tournament;
        for (const id of match.teamA) {
          const row = expected.get(id)!;
          row.points += 10;
          row.wins += 1;
        }
        for (const id of match.teamB) expected.get(id)!.points += 6;
      }

    assert.equal(pendingMatches(tournament), 0);
    assert.ok(canFinishTournament(tournament));
    const standings = computeStandings(tournament);
    for (const row of standings)
      assert.deepEqual(
        { points: row.points, wins: row.wins },
        expected.get(row.playerId),
      );
    const rankedExpected = tournament.players
      .map((player) => ({
        playerId: player.id,
        ...expected.get(player.id)!,
        name: player.name,
      }))
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.wins - a.wins ||
          a.name.localeCompare(b.name, "es"),
      );
    assert.deepEqual(
      standings.map((row) => ({
        playerId: row.playerId,
        points: row.points,
        wins: row.wins,
        position: row.position,
      })),
      rankedExpected.map((row) => ({
        playerId: row.playerId,
        points: row.points,
        wins: row.wins,
        position:
          rankedExpected.findIndex(
            (candidate) =>
              candidate.points === row.points && candidate.wins === row.wins,
          ) + 1,
      })),
    );

    const finished = completeTournament(tournament);
    assert.ok(finished.ok);
    assert.equal(finished.tournament.status, "completed");
  }
});

test("mexicano generates one round at a time from results", () => {
  let t = build(8, 2, "mexicano", 2);
  assert.equal(t.schedule.length, 1);
  assert.ok(!canGenerateNextRound(t));
  assert.ok(!addNextRound(t).ok);
  for (const match of t.schedule[0].matches) {
    const r = recordScore(t, match.id, 12, 4);
    assert.ok(r.ok);
    t = r.tournament;
  }
  assert.ok(!canFinishTournament(t));
  const next = addNextRound(t);
  assert.ok(next.ok);
  t = next.tournament;
  assert.equal(t.schedule.length, 2);
  assert.ok(!canEditScores(t, 1));
  assert.ok(canEditScores(t, 2));
  const top = computeStandings(t).slice(0, 2).map((r) => r.playerId);
  const court1 = t.schedule[1].matches[0];
  assert.ok(top.every((id) => [...court1.teamA, ...court1.teamB].includes(id)));
  assert.ok(!addNextRound(t).ok);
});
