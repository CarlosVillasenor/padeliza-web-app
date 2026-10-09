import { messages } from "@/shared/i18n";
import type { TournamentInput } from "../../../../types/tournament";
import shared from "../../shared.module.css";
import styles from "./ReviewStep.module.css";

const { formats, wizard } = messages.tournaments;
const copy = wizard.review;

/** Summarizes the current tournament configuration before creation. */
export default function ReviewStep({ input }: { input: TournamentInput }) {
  const { name, format, players, courts, points, rounds } = input;
  return (
    <>
      <dl className={styles.summary}>
        <dt className={styles.term}>{copy.name}</dt>
        <dd className={styles.value}>{name}</dd>
        <dt className={styles.term}>{copy.format}</dt>
        <dd className={styles.value}>{formats[format]}</dd>
        <dt className={styles.term}>{copy.players}</dt>
        <dd className={styles.value}>
          {players.length}: {players.map((p) => p.name).join(", ")}
        </dd>
        <dt className={styles.term}>{copy.courts}</dt>
        <dd className={styles.value}>{courts}</dd>
        <dt className={styles.term}>{copy.points}</dt>
        <dd className={styles.value}>{points}</dd>
        <dt className={styles.term}>{copy.rounds}</dt>
        <dd className={styles.value}>{rounds}</dd>
        <dt className={styles.term}>{copy.matchesPerPlayer}</dt>
        <dd className={styles.value}>
          {format === "americano" ? players.length - 1 : rounds}
        </dd>
      </dl>
      {format === "americano" && (
        <p className={shared.intro}>
          {courts * 4 < players.length
            ? copy.americanoWithRests
            : copy.americanoNoRests}
        </p>
      )}
      <p className={shared.intro}>{copy.saveNotice}</p>
    </>
  );
}
