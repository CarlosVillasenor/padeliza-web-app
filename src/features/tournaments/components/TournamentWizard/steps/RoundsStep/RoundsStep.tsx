import { messages } from "@/shared/i18n";
import shared from "../../shared.module.css";

const { rounds: copy } = messages.tournaments.wizard;

type RoundsStepProps = {
  rounds: string;
  onRoundsChange: (rounds: string) => void;
};

export default function RoundsStep({
  rounds,
  onRoundsChange,
}: RoundsStepProps) {
  return (
    <>
      <p className={shared.intro}>{copy.intro}</p>
      <label htmlFor="rounds">{copy.label}</label>
      <input
        id="rounds"
        className={shared.input}
        type="number"
        min={1}
        max={100}
        step={1}
        value={rounds}
        onChange={(e) => onRoundsChange(e.target.value)}
      />
    </>
  );
}
