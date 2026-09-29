"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/shared/components/Button/Button";
import {
  americanoRounds,
  formatNames,
  playerCounts,
  validateTournament,
} from "../lib/rules";
import type {
  Player,
  TournamentFormat,
  TournamentInput,
} from "../types/tournament";
import { useTournaments } from "./TournamentProvider";
import styles from "./Tournaments.module.css";

type Step =
  "type" | "players" | "courts" | "points" | "rounds" | "name" | "review";
const titles: Record<Step, string> = {
  type: "Elige el tipo de torneo",
  players: "Jugadores",
  courts: "Pistas",
  points: "Puntos",
  rounds: "Rondas",
  name: "Nombre del torneo",
  review: "Verifica tu configuración",
};

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
    if (!trimmed) return setError("Escribe el nombre del jugador.");
    if (players.length >= 16)
      return setError("Puedes agregar hasta 16 jugadores.");
    if (
      players.some(
        (p) =>
          p.name.toLocaleLowerCase("es") === trimmed.toLocaleLowerCase("es"),
      )
    )
      return setError(
        "Ese jugador ya está en la lista. Usa un nombre distinto para identificarlo.",
      );
    setPlayers([...players, { id: crypto.randomUUID(), name: trimmed }]);
    setPlayerName("");
    setError(null);
  }
  function next(event: FormEvent) {
    event.preventDefault();
    if (step === "players") {
      if (playerName.trim())
        return setError(
          "Presiona + para agregar el nombre pendiente o borra el campo antes de continuar.",
        );
      if (!playerCounts.includes(players.length))
        return setError("Esta versión admite 4, 8, 12 o 16 jugadores.");
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
      return setError("Escribe entre 1 y 100 puntos.");
    if (
      step === "rounds" &&
      (!Number.isInteger(Number(rounds)) ||
        Number(rounds) < 1 ||
        Number(rounds) > 100)
    )
      return setError("Escribe entre 1 y 100 rondas.");
    if (step === "name" && !name.trim())
      return setError("Escribe el nombre del torneo.");
    if (step === "review") {
      if (saving) return;
      const validation = validateTournament(input);
      if (validation) return setError(validation);
      setSaving(true);
      submissionId.current ??= crypto.randomUUID();
      const failure = store.createTournament(input, submissionId.current);
      if (failure) {
        setSaving(false);
        return setError(failure);
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
          <Link href="/" aria-label="Volver a torneos">
            ←
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => move(steps[index - 1])}
            aria-label="Volver al paso anterior"
          >
            ←
          </button>
        )}
        <span>Nuevo torneo</span>
        <span>
          {index + 1} / {steps.length}
        </span>
      </header>
      <progress
        className={styles.progress}
        value={index + 1}
        max={steps.length}
        aria-label="Progreso de creación"
      />
      <form className={styles.form} onSubmit={next} noValidate>
        <h1 ref={title} tabIndex={-1}>
          {titles[step]}
        </h1>
        {step === "type" && (
          <fieldset>
            <legend>Modalidad</legend>
            {(["americano", "mexicano"] as const).map((value) => (
              <label className={styles.option} key={value}>
                <input
                  type="radio"
                  name="format"
                  checked={format === value}
                  onChange={() => setFormat(value)}
                />
                <span>
                  <strong>{formatNames[value]}</strong>
                  <small>
                    {value === "americano"
                      ? "Cambia de pareja hasta jugar con todos. Rondas calculadas automáticamente."
                      : "Las parejas se ajustan según la clasificación. Tú eliges cuántas rondas jugar."}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
        )}
        {step === "players" && (
          <>
            <p>
              Agrega 4, 8, 12 o 16 jugadores. Cada nombre debe ser distinto.
            </p>
            <label htmlFor="player">Añadir jugador</label>
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
                aria-label="Añadir jugador"
                onClick={addPlayer}
              >
                +
              </button>
            </div>
            <p aria-live="polite">{players.length} jugadores agregados</p>
            <ul className={styles.players}>
              {players.map((player) => (
                <li key={player.id}>
                  <span>{player.name}</span>
                  <button
                    type="button"
                    aria-label={`Eliminar a ${player.name}`}
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
                ? `Para ${players.length} jugadores necesitas ${players.length / 4} pistas: todos juegan en cada ronda.`
                : "¿Cuántas pistas usarás? Con menos pistas habrá turnos de descanso."}
            </p>
            <fieldset>
              <legend>Pistas disponibles</legend>
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
            <p>
              Puntos totales por partido. Si eliges 16, el marcador puede ser
              10–6 u 8–8; no es el primero en llegar a 16.
            </p>
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
            <label htmlFor="points">Puntos totales (personalizable)</label>
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
            <p>
              La primera ronda será aleatoria; las siguientes se organizarán
              según la clasificación. El número de jugadores no determina cuándo
              termina el torneo.
            </p>
            <label htmlFor="rounds">Número de rondas</label>
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
            <label htmlFor="name">Ingresa el nombre de tu torneo</label>
            <div className={styles.row}>
              <input
                id="name"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                type="button"
                aria-label="Generar nombre aleatorio"
                onClick={() =>
                  setName(
                    [
                      "Torneo del Domingo",
                      "Encuentro de Campeones",
                      "Amigos de la Pista",
                      "Tarde de Pádel",
                    ][Math.floor(Math.random() * 4)],
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
              <dt>Nombre</dt>
              <dd>{name}</dd>
              <dt>Tipo</dt>
              <dd>{formatNames[format]}</dd>
              <dt>Jugadores</dt>
              <dd>
                {players.length}: {players.map((p) => p.name).join(", ")}
              </dd>
              <dt>Pistas</dt>
              <dd>{courts}</dd>
              <dt>Puntos totales por partido</dt>
              <dd>{points}</dd>
              <dt>Rondas</dt>
              <dd>{totalRounds}</dd>
              <dt>Partidos por jugador</dt>
              <dd>{format === "americano" ? players.length - 1 : rounds}</dd>
            </dl>
            {format === "americano" && (
              <p>
                Una pareja distinta en cada partido.{" "}
                {courts * 4 < players.length
                  ? "Habrá descansos: completamos cada rotación por turnos antes de la siguiente."
                  : "Todos juegan en cada ronda."}
              </p>
            )}
            <p>
              El torneo se guardará en este navegador. La captura de resultados
              estará disponible en una siguiente entrega.
            </p>
          </>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {store.error && (
          <div role="alert" className={styles.error}>
            {store.error}
            <button type="button" onClick={store.reload}>
              Volver a intentar
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
          {step === "review"
            ? saving
              ? "Guardando…"
              : "Crear torneo"
            : "Siguiente →"}
        </Button>
      </form>
    </main>
  );
}
