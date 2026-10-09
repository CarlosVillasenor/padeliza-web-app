import { messages } from "@/shared/i18n";
import { tournamentFormats } from "../../../../lib/rules";
import type { TournamentFormat } from "../../../../types/tournament";
import shared from "../../shared.module.css";

const { formats, formatDescriptions, wizard: copy } = messages.tournaments;

type TypeStepProps = {
  format: TournamentFormat;
  onFormatChange: (format: TournamentFormat) => void;
};

/** Lets the user choose the tournament format and explains each option. */
export default function TypeStep({ format, onFormatChange }: TypeStepProps) {
  return (
    <fieldset className={shared.fieldset}>
      <legend className={shared.legend}>{copy.type.legend}</legend>
      {tournamentFormats.map((value) => (
        <label className={shared.option} key={value}>
          <input
            type="radio"
            name="format"
            checked={format === value}
            onChange={() => onFormatChange(value)}
          />
          <span>
            <strong>{formats[value]}</strong>
            <small className={shared.optionHint}>
              {formatDescriptions[value]}
            </small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
