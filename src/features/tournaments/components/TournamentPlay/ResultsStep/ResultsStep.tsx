import Link from "next/link";
import { messages } from "@/shared/i18n";
import { computeStandings } from "../../../lib/standings";
import type { Tournament } from "../../../types/tournament";
import styles from "./ResultsStep.module.css";

const { play: copy } = messages.tournaments;

// Rows use flexbox for even spacing; ARIA roles keep the table semantics.
/**
 * Shows final tournament standings and a link back to the tournament list.
 * Standings are calculated from the completed matches in `tournament`.
 */
export default function ResultsStep({ tournament }: { tournament: Tournament }) {
  const standings = computeStandings(tournament);
  return (
    <main className={styles.shell}>
      <h1 className={styles.title}>{copy.resultsTitle}</h1>
      <div
        role="table"
        aria-label={copy.resultsCaption(tournament.name)}
        className={styles.table}
      >
        <div role="rowgroup" className={styles.group}>
          <div role="row" className={`${styles.row} ${styles.head}`}>
            <span role="columnheader" className={styles.cell}>
              {copy.position}
            </span>
            <span role="columnheader" className={styles.cell}>
              {copy.player}
            </span>
            <span role="columnheader" className={`${styles.cell} ${styles.points}`}>
              <abbr title={copy.pointsFull}>{copy.points}</abbr>
            </span>
          </div>
        </div>
        <div role="rowgroup" className={styles.group}>
          {standings.map((row) => (
            <div
              key={row.playerId}
              role="row"
              className={`${styles.row} ${row.position === 1 ? styles.first : ""}`}
            >
              <span role="cell" className={styles.cell}>
                {row.position}
              </span>
              <span role="rowheader" className={styles.cell}>
                {row.name}
              </span>
              <span role="cell" className={`${styles.cell} ${styles.points}`}>
                {row.points}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Link className={styles.home} href="/">
        {copy.home}
      </Link>
    </main>
  );
}
