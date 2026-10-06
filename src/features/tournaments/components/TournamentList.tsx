"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useTournaments } from "./TournamentProvider";
import { formatNames } from "../lib/rules";
import styles from "./Tournaments.module.css";

export default function TournamentList({
  emptyState,
}: {
  emptyState: ReactNode;
}) {
  const { tournaments, ready, error, reload } = useTournaments();
  if (!ready) return <p role="status">Cargando tus torneos…</p>;
  if (error)
    return (
      <div role="alert">
        <p>{error}</p>
        <button onClick={reload}>Volver a intentar</button>
      </div>
    );
  return (
    <>
      {tournaments.length === 0 ? (
        emptyState
      ) : (
        <ul className={styles.cards}>
          {tournaments.map((t) => (
            <li key={t.id} className={styles.card}>
              <h2>{t.name}</h2>
              <p>{formatNames[t.format]} · Preparado</p>
              <p>
                {t.players.length} jugadores · {t.courts} pistas · {t.rounds}{" "}
                rondas
              </p>
              <p>{t.points} puntos totales por partido</p>
              <details>
                <summary>Ver jugadores</summary>
                <p>{t.players.map((p) => p.name).join(", ")}</p>
              </details>
            </li>
          ))}
        </ul>
      )}
      <Link className={styles.createLink} href="/tournaments/new">
        + Crear torneo
      </Link>
      <p style={{ marginTop: "1rem", fontSize: ".85rem", textAlign: "center" }}>
        Guardado solo en este navegador. Borrar los datos del sitio elimina los
        torneos.
      </p>
    </>
  );
}
