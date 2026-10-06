"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/shared/components/Button/Button";
import { locale, messages } from "@/shared/i18n";
import {
  americanoRounds,
  playerCounts,
  tournamentFormats,
  validateTournament,
} from "../lib/rules";
import type {
  Player,
  TournamentFormat,
  TournamentInput,
} from "../types/tournament";
import { useTournaments } from "./TournamentProvider";
import styles from "./Tournaments.module.css";

const {
  formats,
  formatDescriptions,
  errors,
  wizard: copy,
} = messages.tournaments;

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
  function addPlayer() {
    const trimmed = playerName.trim();
    if (!trimmed) return setError(copy.stepErrors.playerNameRequired);
    if (players.length >= 16) return setError(copy.stepErrors.maxPlayers);
    if (
      players.some(
        (p) =>
          p.name.toLocaleLowerCase(locale) ===
          trimmed.toLocaleLowerCase(locale),
      )
    )
      return setError(copy.stepErrors.duplicatePlayer);
    setPlayers([...players, { id: crypto.randomUUID(), name: trimmed }]);
    setPlayerName("");
    setError(null);
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
      router.push("/");
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
          <fieldset>
            <legend>{copy.type.legend}</legend>
            {tournamentFormats.map((value) => (
              <label className={styles.option} key={value}>
                <input
                  type="radio"
                  name="format"
                  checked={format === value}
                  onChange={() => setFormat(value)}
                />
                <span>
                  <strong>{formats[value]}</strong>
                  <small>{formatDescriptions[value]}</small>
                </span>
              </label>
            ))}
          </fieldset>
        )}
        {step === "players" && (
          <>
            <p>{copy.players.intro}</p>
            <label htmlFor="player">{copy.players.inputLabel}</label>
            <div className={styles.row}>
              <input
                id="player"
                autoComplete="off"
                maxLength={50}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPlayer();
                  }
                }}
              />
              <button
                type="button"
                aria-label={copy.players.addButton}
                onClick={addPlayer}
              >
                +
              </button>
            </div>
            <p aria-live="polite">{copy.players.added(players.length)}</p>
            <ul className={styles.players}>
              {players.map((player) => (
                <li key={player.id}>
                  <span>{player.name}</span>
                  <button
                    type="button"
                    aria-label={copy.players.remove(player.name)}
                    onClick={() =>
                      setPlayers(players.filter((p) => p.id !== player.id))
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {step === "courts" && (
          <>
            <p>
              {format === "mexicano"
                ? copy.courts.introMexicano(players.length, players.length / 4)
                : copy.courts.introAmericano}
            </p>
            <fieldset>
              <legend>{copy.courts.legend}</legend>
              <div className={styles.choices}>
                {[1, 2, 3, 4].map((value) => (
                  <label className={styles.option} key={value}>
                    <input
                      type="radio"
                      name="courts"
                      checked={courts === value}
                      disabled={
                        format === "mexicano"
                          ? value !== players.length / 4
                          : value > players.length / 4
                      }
                      onChange={() => setCourts(value)}
                    />
                    {value}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
        {step === "points" && (
          <>
            <p>{copy.points.intro}</p>
            <div className={styles.choices}>
              {[8, 16, 24, 32].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={points === String(value)}
                  onClick={() => setPoints(String(value))}
                >
                  {value}
                </button>
              ))}
            </div>
            <label htmlFor="points">{copy.points.customLabel}</label>
            <input
              id="points"
              type="number"
              min={1}
              max={100}
              step={1}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </>
        )}
        {step === "rounds" && (
          <>
            <p>{copy.rounds.intro}</p>
            <label htmlFor="rounds">{copy.rounds.label}</label>
            <input
              id="rounds"
              type="number"
              min={1}
              max={100}
              step={1}
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
            />
          </>
        )}
        {step === "name" && (
          <>
            <label htmlFor="name">{copy.name.label}</label>
            <div className={styles.row}>
              <input
                id="name"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                type="button"
                aria-label={copy.name.randomButton}
                onClick={() =>
                  setName(
                    copy.name.randomNames[
                      Math.floor(Math.random() * copy.name.randomNames.length)
                    ],
                  )
                }
              >
                ⚄
              </button>
            </div>
          </>
        )}
        {step === "review" && (
          <>
            <dl className={styles.summary}>
              <dt>{copy.review.name}</dt>
              <dd>{name}</dd>
              <dt>{copy.review.format}</dt>
              <dd>{formats[format]}</dd>
              <dt>{copy.review.players}</dt>
              <dd>
                {players.length}: {players.map((p) => p.name).join(", ")}
              </dd>
              <dt>{copy.review.courts}</dt>
              <dd>{courts}</dd>
              <dt>{copy.review.points}</dt>
              <dd>{points}</dd>
              <dt>{copy.review.rounds}</dt>
              <dd>{totalRounds}</dd>
              <dt>{copy.review.matchesPerPlayer}</dt>
              <dd>{format === "americano" ? players.length - 1 : rounds}</dd>
            </dl>
            {format === "americano" && (
              <p>
                {courts * 4 < players.length
                  ? copy.review.americanoWithRests
                  : copy.review.americanoNoRests}
              </p>
            )}
            <p>{copy.review.saveNotice}</p>
          </>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {store.error && (
          <div role="alert" className={styles.error}>
            {errors[store.error]}
            <button type="button" onClick={store.reload}>
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
