import { useEffect, useRef } from "react";
import { messages } from "@/shared/i18n";
import { isRoundComplete } from "../../../lib/scoring";
import type { Tournament } from "../../../types/tournament";
import styles from "./RoundCarousel.module.css";

const { play: copy } = messages.tournaments;

type Props = {
  tournament: Tournament;
  current: number;
  onSelect: (roundNumber: number) => void;
};

export default function RoundCarousel({ tournament, current, onSelect }: Props) {
  const active = useRef<HTMLButtonElement>(null);

  // Keep the selected chip visible when the list overflows horizontally.
  useEffect(() => {
    active.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [current]);

  return (
    <nav aria-label={copy.roundsNavLabel} className={styles.carousel}>
      <ul className={styles.list}>
        {Array.from({ length: tournament.rounds }, (_, i) => i + 1).map(
          (number) => {
            const round = tournament.schedule.find((r) => r.number === number);
            const state = !round
              ? "locked"
              : isRoundComplete(round)
                ? "complete"
                : "pending";
            const isCurrent = number === current;
            return (
              <li key={number}>
                <button
                  type="button"
                  ref={isCurrent ? active : undefined}
                  className={`${styles.chip} ${styles[state]}`}
                  disabled={state === "locked"}
                  aria-current={isCurrent ? "true" : undefined}
                  aria-label={copy.roundChipLabel(number, state)}
                  onClick={() => onSelect(number)}
                >
                  <span aria-hidden="true">{number}</span>
                  {state === "complete" && (
                    <span className={styles.check} aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          },
        )}
      </ul>
    </nav>
  );
}
