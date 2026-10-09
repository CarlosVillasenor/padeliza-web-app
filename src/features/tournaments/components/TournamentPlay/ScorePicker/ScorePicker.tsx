import { useEffect, useRef, type MouseEvent } from "react";
import { messages } from "@/shared/i18n";
import styles from "./ScorePicker.module.css";

const { play: copy } = messages.tournaments;

type Props = {
  team: string;
  points: number;
  current: number | null;
  onSelect: (value: number) => void;
  onClose: () => void;
};

// A modal bottom sheet: the native <dialog> traps focus, handles Escape and
// returns focus to the score button that opened it.
/**
 * Lets the user select one team's score from 0 through `points`.
 * Reports the selection and closes; the parent owns score persistence and
 * supplies `current` to mark the existing selection.
 */
export default function ScorePicker({
  team,
  points,
  current,
  onSelect,
  onClose,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  function handleSelect(value: number) {
    onSelect(value);
    dialog.current?.close();
  }
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) dialog.current?.close();
  }

  return (
    <dialog
      ref={dialog}
      className={styles.sheet}
      aria-labelledby="score-picker-title"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <h2 id="score-picker-title" className={styles.title}>
        {copy.pickerTitle(team)}
      </h2>
      <p className={styles.hint}>{copy.pickerHint(points)}</p>
      <div className={styles.grid}>
        {Array.from({ length: points + 1 }, (_, value) => (
          <button
            key={value}
            type="button"
            className={styles.option}
            aria-label={copy.pickerOption(value)}
            aria-pressed={value === current}
            onClick={() => handleSelect(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={styles.close}
        onClick={() => dialog.current?.close()}
      >
        {copy.pickerClose}
      </button>
    </dialog>
  );
}
