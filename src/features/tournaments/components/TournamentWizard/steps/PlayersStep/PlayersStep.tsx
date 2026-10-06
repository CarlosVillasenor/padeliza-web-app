import { locale, messages } from "@/shared/i18n";
import type { Player } from "../../../../types/tournament";
import shared from "../../shared.module.css";
import styles from "./PlayersStep.module.css";

const { stepErrors, players: copy } = messages.tournaments.wizard;

type PlayersStepProps = {
  players: Player[];
  playerName: string;
  onPlayersChange: (players: Player[]) => void;
  onPlayerNameChange: (name: string) => void;
  onError: (message: string | null) => void;
};

export default function PlayersStep({
  players,
  playerName,
  onPlayersChange,
  onPlayerNameChange,
  onError,
}: PlayersStepProps) {
  function addPlayer() {
    const trimmed = playerName.trim();
    if (!trimmed) return onError(stepErrors.playerNameRequired);
    if (players.length >= 16) return onError(stepErrors.maxPlayers);
    if (
      players.some(
        (p) =>
          p.name.toLocaleLowerCase(locale) ===
          trimmed.toLocaleLowerCase(locale),
      )
    )
      return onError(stepErrors.duplicatePlayer);
    onPlayersChange([...players, { id: crypto.randomUUID(), name: trimmed }]);
    onPlayerNameChange("");
    onError(null);
  }

  return (
    <>
      <p className={shared.intro}>{copy.intro}</p>
      <label htmlFor="player">{copy.inputLabel}</label>
      <div className={shared.row}>
        <input
          id="player"
          className={shared.input}
          autoComplete="off"
          maxLength={50}
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addPlayer();
            }
          }}
        />
        <button
          type="button"
          className={shared.button}
          aria-label={copy.addButton}
          onClick={addPlayer}
        >
          +
        </button>
      </div>
      <p className={shared.intro} aria-live="polite">
        {copy.added(players.length)}
      </p>
      <ul className={styles.list}>
        {players.map((player) => (
          <li className={styles.item} key={player.id}>
            <span className={styles.name}>{player.name}</span>
            <button
              type="button"
              className={shared.button}
              aria-label={copy.remove(player.name)}
              onClick={() =>
                onPlayersChange(players.filter((p) => p.id !== player.id))
              }
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
