import { messages } from "@/shared/i18n";
import { maxCourts as courtOptions } from "../../../../lib/rules";
import type { TournamentFormat } from "../../../../types/tournament";
import shared from "../../shared.module.css";

const { courts: copy } = messages.tournaments.wizard;

type CourtsStepProps = {
  format: TournamentFormat;
  playerCount: number;
  courts: number;
  onCourtsChange: (courts: number) => void;
};

export default function CourtsStep({
  format,
  playerCount,
  courts,
  onCourtsChange,
}: CourtsStepProps) {
  const playerMaxCourts = Math.floor(playerCount / 4);
  return (
    <>
      <p className={shared.intro}>
        {format === "mexicano"
          ? copy.introMexicano(playerCount, playerMaxCourts)
          : copy.introAmericano}
      </p>
      <fieldset className={shared.fieldset}>
        <legend className={shared.legend}>{copy.legend}</legend>
        <div className={shared.choices}>
          {Array.from({ length: courtOptions }, (_, index) => index + 1).map(
            (value) => (
            <label className={shared.option} key={value}>
              <input
                type="radio"
                name="courts"
                checked={courts === value}
                disabled={
                  format === "mexicano"
                    ? value !== playerMaxCourts
                    : value > playerMaxCourts
                }
                onChange={() => onCourtsChange(value)}
              />
              {value}
            </label>
            ),
          )}
        </div>
      </fieldset>
    </>
  );
}
