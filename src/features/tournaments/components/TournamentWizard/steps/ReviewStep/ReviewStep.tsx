import { messages } from "@/shared/i18n";
import { americanoPlayerMatchRange } from "../../../../lib/rules";
import type { TournamentInput } from "../../../../types/tournament";
import shared from "../../shared.module.css";
import styles from "./ReviewStep.module.css";

const { formats, wizard } = messages.tournaments;
const copy = wizard.review;

export default function ReviewStep({ input }: { input: TournamentInput }) {
  const { name, format, players, courts, points, rounds } = input;
  const [minMatches, maxMatches] = americanoPlayerMatchRange(players.length);
  const matchesPerPlayer =
    format === "americano" && minMatches !== maxMatches
      ? `${minMatches}–${maxMatches}`
      : String(format === "americano" ? minMatches : rounds);
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
        <dd className={styles.value}>{matchesPerPlayer}</dd>
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
