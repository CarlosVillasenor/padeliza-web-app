import { messages } from "@/shared/i18n";
import { isMatchComplete } from "../../../lib/scoring";
import type { TeamSide } from "../../../lib/scoring";
import type { Match } from "../../../types/tournament";
import styles from "./MatchCard.module.css";

const { play: copy } = messages.tournaments;

type Props = {
  match: Match;
  names: ReadonlyMap<string, string>;
  editable: boolean;
  onEditScore: (side: TeamSide) => void;
};

function formatScore(score: number | null) {
  return score === null ? "–" : String(score).padStart(2, "0");
}

/**
 * Displays a court's teams, scores, and result status.
 * Score buttons are disabled when editing is unavailable and report the
 * selected team side through `onEditScore`.
 */
export default function MatchCard({ match, names, editable, onEditScore }: Props) {
  const done = isMatchComplete(match);
  const teams = [
    { side: "a" as const, ids: match.teamA, score: match.scoreA },
    { side: "b" as const, ids: match.teamB, score: match.scoreB },
  ];
  return (
    <article
      className={`${styles.card} ${done ? styles.done : styles.pending}`}
      aria-label={copy.court(match.court)}
    >
      <p className={styles.court}>{copy.court(match.court)}</p>
      <div className={styles.teams}>
        {teams.map(({ side, ids, score }) => {
          const label = ids.map((id) => names.get(id)).join(` ${copy.and} `);
          return (
            <div key={side} className={styles.team}>
              <button
                type="button"
                className={styles.score}
                disabled={!editable}
                aria-label={copy.editScore(
                  label,
                  score === null ? copy.scoreUnset : String(score),
                )}
                onClick={() => onEditScore(side)}
              >
                {formatScore(score)}
              </button>
              <p className={styles.names}>{label}</p>
            </div>
          );
        })}
        <span className={styles.versus} aria-hidden="true">
          {copy.versus}
        </span>
      </div>
      <p className={styles.status}>
        {done ? copy.matchDone : copy.matchPending}
      </p>
    </article>
  );
}
