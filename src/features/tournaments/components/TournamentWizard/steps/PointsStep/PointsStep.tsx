import { messages } from "@/shared/i18n";
import shared from "../../shared.module.css";

const { points: copy } = messages.tournaments.wizard;

type PointsStepProps = {
  points: string;
  onPointsChange: (points: string) => void;
};

export default function PointsStep({
  points,
  onPointsChange,
}: PointsStepProps) {
  return (
    <>
      <p className={shared.intro}>{copy.intro}</p>
      <div className={shared.choices}>
        {[8, 16, 24, 32].map((value) => (
          <button
            type="button"
            className={shared.choiceButton}
            key={value}
            aria-pressed={points === String(value)}
            onClick={() => onPointsChange(String(value))}
          >
            {value}
          </button>
        ))}
      </div>
      <label htmlFor="points">{copy.customLabel}</label>
      <input
        id="points"
        className={shared.input}
        type="number"
        min={1}
        max={100}
        step={1}
        value={points}
        onChange={(e) => onPointsChange(e.target.value)}
      />
    </>
  );
}
