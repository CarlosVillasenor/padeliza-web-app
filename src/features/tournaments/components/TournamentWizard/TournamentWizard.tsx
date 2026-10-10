"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/shared/components/Button/Button";
import { trackEvent } from "@/shared/lib/analytics";
import { messages } from "@/shared/i18n";
import {
  americanoRounds,
  playerCounts,
  validateTournament,
} from "../../lib/rules";
import type {
  Player,
  TournamentFormat,
  TournamentInput,
} from "../../types/tournament";
import { useTournaments } from "../TournamentProvider";
import CourtsStep from "./steps/CourtsStep/CourtsStep";
import NameStep from "./steps/NameStep/NameStep";
import PlayersStep from "./steps/PlayersStep/PlayersStep";
import PointsStep from "./steps/PointsStep/PointsStep";
import ReviewStep from "./steps/ReviewStep/ReviewStep";
import RoundsStep from "./steps/RoundsStep/RoundsStep";
import TypeStep from "./steps/TypeStep/TypeStep";
import styles from "./TournamentWizard.module.css";

const { errors, wizard: copy } = messages.tournaments;

// An SVG centers predictably; the "←" glyph sits on the text baseline.
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

type Step =
  "type" | "players" | "courts" | "points" | "rounds" | "name" | "review";

export default function TournamentWizard() {
  const router = useRouter();
  const store = useTournaments();
  const [step, setStep] = useState<Step>("type");
  const [format, setFormat] = useState<TournamentFormat>("americano");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [courts, setCourts] = useState(1);
  const [points, setPoints] = useState("16");
  const [rounds, setRounds] = useState("7");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submissionId = useRef<string | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const steps: Step[] = [
    "type",
    "players",
    "courts",
    "points",
    ...(format === "mexicano" ? ["rounds" as const] : []),
    "name",
    "review",
  ];
  const index = steps.indexOf(step);
  const totalRounds =
    format === "americano"
      ? americanoRounds(players.length, courts)
      : Number(rounds);
  const input: TournamentInput = {
    name,
    format,
    players,
    courts,
    points: Number(points),
    rounds: totalRounds,
  };

  useEffect(() => {
    title.current?.focus();
  }, [step]);
  function move(next: Step) {
    setError(null);
    setStep(next);
  }
  function next(event: FormEvent) {
    event.preventDefault();
    if (step === "players") {
      if (playerName.trim()) return setError(copy.stepErrors.pendingPlayerName);
      if (!playerCounts.includes(players.length))
        return setError(copy.stepErrors.unsupportedPlayerCount);
      setCourts(
        format === "mexicano"
          ? players.length / 4
          : Math.min(courts, players.length / 4),
      );
    }
    if (
      step === "points" &&
      (!Number.isInteger(Number(points)) ||
        Number(points) < 1 ||
        Number(points) > 100)
    )
      return setError(copy.stepErrors.pointsRange);
    if (
      step === "rounds" &&
      (!Number.isInteger(Number(rounds)) ||
        Number(rounds) < 1 ||
        Number(rounds) > 100)
    )
      return setError(copy.stepErrors.roundsRange);
    if (step === "name" && !name.trim())
      return setError(copy.stepErrors.nameRequired);
    if (step === "review") {
      if (saving) return;
      const validation = validateTournament(input);
      if (validation) return setError(errors[validation]);
      setSaving(true);
      submissionId.current ??= crypto.randomUUID();
      const failure = store.createTournament(input, submissionId.current);
      if (failure) {
        setSaving(false);
        return setError(errors[failure]);
      }
      trackEvent("tournament-created", {
        format,
        players: players.length,
        courts,
        rounds: totalRounds,
      });
      router.push(`/tournaments/${submissionId.current}`);
      return;
    }
    move(steps[index + 1]);
  }
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        {index === 0 ? (
          <Link
            href="/"
            className={styles.backButton}
            aria-label={copy.backToTournaments}
          >
            {backIcon}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => move(steps[index - 1])}
            className={styles.backButton}
            aria-label={copy.backToPreviousStep}
          >
            {backIcon}
          </button>
        )}
        <span>{copy.title}</span>
        <span>{copy.stepProgress(index + 1, steps.length)}</span>
      </header>
      <progress
        className={styles.progress}
        value={index + 1}
        max={steps.length}
        aria-label={copy.progressLabel}
      />
      <form className={styles.form} onSubmit={next} noValidate>
        <h1 ref={title} tabIndex={-1}>
          {copy.stepTitles[step]}
        </h1>
        {step === "type" && (
          <TypeStep format={format} onFormatChange={setFormat} />
        )}
        {step === "players" && (
          <PlayersStep
            players={players}
            playerName={playerName}
            onPlayersChange={setPlayers}
            onPlayerNameChange={setPlayerName}
            onError={setError}
          />
        )}
        {step === "courts" && (
          <CourtsStep
            format={format}
            playerCount={players.length}
            courts={courts}
            onCourtsChange={setCourts}
          />
        )}
        {step === "points" && (
          <PointsStep points={points} onPointsChange={setPoints} />
        )}
        {step === "rounds" && (
          <RoundsStep rounds={rounds} onRoundsChange={setRounds} />
        )}
        {step === "name" && <NameStep name={name} onNameChange={setName} />}
        {step === "review" && <ReviewStep input={input} />}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {store.error && (
          <div role="alert" className={styles.error}>
            {errors[store.error]}
            <button
              type="button"
              className={styles.retry}
              onClick={store.reload}
            >
              {messages.common.retry}
            </button>
          </div>
        )}
        <Button
          className={styles.submit}
          type="submit"
          disabled={
            saving || (step === "review" && (!store.ready || !!store.error))
          }
        >
          {step === "review" ? (
            saving ? (
              copy.actions.saving
            ) : (
              copy.actions.create
            )
          ) : (
            <>
              <span className={styles.nextLabel}>{copy.actions.next}</span>
              <svg
                className={styles.nextIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </Button>
      </form>
    </main>
  );
}
