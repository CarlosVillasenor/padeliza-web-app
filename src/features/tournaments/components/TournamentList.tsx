"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useTournaments } from "./TournamentProvider";
import { messages } from "@/shared/i18n";
import styles from "./TournamentList.module.css";

const { formats, errors, status, list: copy } = messages.tournaments;

export default function TournamentList({
  emptyState,
}: {
  emptyState: ReactNode;
}) {
  const { tournaments, ready, error, reload } = useTournaments();
  if (!ready) return <p role="status">{copy.loading}</p>;
  if (error)
    return (
      <div role="alert">
        <p>{errors[error]}</p>
        <button onClick={reload}>{messages.common.retry}</button>
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
              <h2>
                <Link href={`/tournaments/${t.id}`}>{t.name}</Link>
              </h2>
              <p>
                {formats[t.format]} · {status[t.status]}
              </p>
              <p>
                {copy.playerCount(t.players.length)} ·{" "}
                {copy.courtCount(t.courts)} · {copy.roundCount(t.rounds)}
              </p>
              <p>{copy.pointsPerMatch(t.points)}</p>
              <details>
                <summary>{copy.viewPlayers}</summary>
                <p>{t.players.map((p) => p.name).join(", ")}</p>
              </details>
            </li>
          ))}
        </ul>
      )}
      <Link className={styles.createLink} href="/tournaments/new">
        {copy.create}
      </Link>
    </>
  );
}
