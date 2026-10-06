import { messages } from "@/shared/i18n";
import shared from "../../shared.module.css";

const { name: copy } = messages.tournaments.wizard;

type NameStepProps = {
  name: string;
  onNameChange: (name: string) => void;
};

export default function NameStep({ name, onNameChange }: NameStepProps) {
  return (
    <>
      <label htmlFor="name">{copy.label}</label>
      <div className={shared.row}>
        <input
          id="name"
          className={shared.input}
          maxLength={80}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <button
          type="button"
          className={shared.button}
          aria-label={copy.randomButton}
          onClick={() =>
            onNameChange(
              copy.randomNames[
                Math.floor(Math.random() * copy.randomNames.length)
              ],
            )
          }
        >
          ⚄
        </button>
      </div>
    </>
  );
}
