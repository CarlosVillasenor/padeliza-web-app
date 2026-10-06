"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/shared/components/Button/Button";
import { messages } from "@/shared/i18n";
import {
  canEditScores,
  canFinishTournament,
  canGenerateNextRound,
  defaultRoundNumber,
  pendingMatches,
  ungeneratedRounds,
} from "../../lib/progress";
import { scoresFromSelection } from "../../lib/scoring";
import type { TeamSide } from "../../lib/scoring";
import type { TournamentError } from "../../types/tournament";
import { useTournaments } from "../TournamentProvider";
import MatchCard from "./MatchCard/MatchCard";
import ResultsStep from "./ResultsStep/ResultsStep";
import RoundCarousel from "./RoundCarousel/RoundCarousel";
import ScorePicker from "./ScorePicker/ScorePicker";
import styles from "./TournamentPlay.module.css";

const { errors, play: copy } = messages.tournaments;

type PickerTarget = { matchId: string; side: TeamSide };

const backIcon = (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.25"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);

export default function TournamentPlay({ id }: { id: string }) {
  const store = useTournaments();
  const tournament = store.tournaments.find((t) => t.id === id);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [error, setError] = useState<TournamentError | null>(null);

  if (!store.ready) return <p role="status">{copy.loading}</p>;
  if (store.error)
    return (
      <main className={styles.shell}>
        <div role="alert" className={styles.error}>
          {errors[store.error]}
          <button type="button" onClick={store.reload}>
            {messages.common.retry}
          </button>
        </div>
      </main>
    );
  if (!tournament)
    return (
      <main className={styles.shell}>
        <p role="alert">{copy.notFound}</p>
        <Link className={styles.homeLink} href="/">
          {copy.backToTournaments}
        </Link>
      </main>
    );
  if (tournament.status === "completed")
    return <ResultsStep tournament={tournament} />;

  const roundNumber = selectedRound ?? defaultRoundNumber(tournament);
  const round =
    tournament.schedule.find((r) => r.number === roundNumber) ??
    tournament.schedule[0];
  const editable = canEditScores(tournament, round.number);
  const names = new Map(tournament.players.map((p) => [p.id, p.name]));
  const pickerMatch = picker
    ? round.matches.find((m) => m.id === picker.matchId)
    : undefined;
  const canFinish = canFinishTournament(tournament);
  const pending = pendingMatches(tournament);
  const missingRounds = ungeneratedRounds(tournament);
  const hint = pending
    ? copy.pendingMatches(pending)
    : missingRounds
      ? copy.pendingRounds(missingRounds)
      : null;

  function handleSelectScore(value: number) {
    if (!picker || !pickerMatch) return;
    const { scoreA, scoreB } = scoresFromSelection(
      tournament!.points,
      picker.side,
      value,
    );
    setError(store.setScore(tournament!.id, pickerMatch.id, scoreA, scoreB));
  }
  function handleGenerateRound() {
    const failure = store.generateNextRound(tournament!.id);
    setError(failure);
    if (!failure) setSelectedRound(tournament!.schedule.length + 1);
  }
  function handleFinish() {
    setError(store.finishTournament(tournament!.id));
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link
          href="/"
          className={styles.backButton}
          aria-label={copy.backToTournaments}
        >
          {backIcon}
        </Link>
        <p className={styles.tournamentName}>{tournament.name}</p>
      </header>
      <h1 className={styles.title}>{copy.roundsTitle}</h1>
      <RoundCarousel
        tournament={tournament}
        current={round.number}
        onSelect={setSelectedRound}
      />
      <h2 className={styles.roundTitle}>{copy.round(round.number)}</h2>
      <ul className={styles.matches}>
        {round.matches.map((match) => (
          <li key={match.id}>
            <MatchCard
              match={match}
              names={names}
              editable={editable}
              onEditScore={(side) =>
                setPicker({ matchId: match.id, side })
              }
            />
          </li>
        ))}
      </ul>
      {error && (
        <p className={styles.error} role="alert">
          {errors[error]}
        </p>
      )}
      {canGenerateNextRound(tournament) &&
        round.number === tournament.schedule.length && (
          <Button className={styles.secondary} onClick={handleGenerateRound}>
            {copy.generateRound(tournament.schedule.length + 1)}
          </Button>
        )}
      <footer className={styles.footer}>
        {hint && (
          <p id="finish-hint" className={styles.hint}>
            {hint}
          </p>
        )}
        <Button
          className={styles.finish}
          disabled={!canFinish}
          aria-describedby={hint ? "finish-hint" : undefined}
          onClick={handleFinish}
        >
          {copy.finish}
        </Button>
      </footer>
      {picker && pickerMatch && (
        <ScorePicker
          key={`${picker.matchId}-${picker.side}`}
          team={(picker.side === "a" ? pickerMatch.teamA : pickerMatch.teamB)
            .map((p) => names.get(p))
            .join(` ${copy.and} `)}
          points={tournament.points}
          current={picker.side === "a" ? pickerMatch.scoreA : pickerMatch.scoreB}
          onSelect={handleSelectScore}
          onClose={() => setPicker(null)}
        />
      )}
    </main>
  );
}
