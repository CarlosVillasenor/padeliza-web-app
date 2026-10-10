"use client";
import Link from "next/link";
import { useState, type ChangeEvent, type ReactNode } from "react";
import Button from "@/shared/components/Button/Button";
import { messages } from "@/shared/i18n";
import { decodeTournaments, encodeTournaments } from "../lib/storage";
import { useTournaments } from "./TournamentProvider";
import styles from "./TournamentList.module.css";

const { formats, errors, status, list: copy } = messages.tournaments;

export default function TournamentList({
  emptyState,
}: {
  emptyState: ReactNode;
}) {
  const {
    tournaments,
    ready,
    error,
    reload,
    deleteTournament,
    importTournaments,
  } = useTournaments();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  if (!ready) return <p role="status">{copy.loading}</p>;
  if (error)
    return (
      <div role="alert">
        <p>{errors[error]}</p>
        <button onClick={reload}>{messages.common.retry}</button>
      </div>
    );

  function removeTournament(tournamentId: string) {
    const failure = deleteTournament(tournamentId);
    setPendingDeleteId(null);
    setNotice(null);
    setActionError(failure ? errors[failure] : null);
  }

  function exportBackup() {
    const blob = new Blob([encodeTournaments(tournaments)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `padeliza-copia-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const failure = importTournaments(decodeTournaments(await file.text()));
      setActionError(failure ? errors[failure] : null);
      setNotice(failure ? null : copy.importDone);
    } catch {
      setNotice(null);
      setActionError(errors.importInvalid);
    }
  }

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
              {pendingDeleteId === t.id ? (
                <div className={styles.confirm}>
                  <p>{copy.confirmDelete(t.name)}</p>
                  <div className={styles.actions}>
                    <Button onClick={() => removeTournament(t.id)}>
                      {copy.confirmDeleteButton}
                    </Button>
                    <Button onClick={() => setPendingDeleteId(null)}>
                      {copy.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className={styles.deleteButton}
                  onClick={() => setPendingDeleteId(t.id)}
                >
                  {copy.deleteButton}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {actionError && <p role="alert">{actionError}</p>}
      {notice && <p role="status">{notice}</p>}
      <div className={styles.actions}>
        <Button onClick={exportBackup} disabled={tournaments.length === 0}>
          {copy.exportButton}
        </Button>
        <label className={styles.importLabel}>
          {copy.importLabel}
          <input
            type="file"
            accept="application/json,.json"
            onChange={importBackup}
          />
        </label>
      </div>
      <Link className={styles.createLink} href="/tournaments/new">
        {copy.create}
      </Link>
    </>
  );
}
