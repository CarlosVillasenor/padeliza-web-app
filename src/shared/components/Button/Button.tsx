import styles from "./Button.module.css";

export default function CreateTournamentButton() {
  return (
    <button className={styles.button} type="button">
      <span className={styles.plus} aria-hidden="true">
        +
      </span>
      <span>Crear torneo</span>
    </button>
  );
}
