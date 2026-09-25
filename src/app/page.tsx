import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.appShell} aria-labelledby="tournaments-title">
        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="Padeliza, inicio">
            <Image
              src="/images/branding/isotype.png"
              alt="Padeliza logo"
              width={32}
              height={32}
            />
            <span>Padeliza</span>
          </Link>

          <nav
            className={styles.headerActions}
            aria-label="Acciones principales"
          >
            <button
              className={styles.iconButton}
              type="button"
              aria-label="Ver torneos"
            >

            </button>
            <button
              className={styles.iconButton}
              type="button"
              aria-label="Más opciones"
            >
              <span className={styles.menuDots} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </button>
          </nav>
        </header>

        <div className={styles.content}>
          <h1 className={styles.title} id="tournaments-title">
            Torneos
          </h1>

          <div className={styles.emptyState}>
            <Image
              className={styles.illustration}
              src="/images/illustrations/empty-tournaments.png"
              alt="Raqueta y pelota de pádel"
              width={1521}
              height={1034}
              loading="eager"
            />
            <div className={styles.copy}>
              <h2>No hay torneos</h2>
              <p>
                Crea tu primer torneo para
                <br /> empezar
              </p>
            </div>
          </div>

          <button className={styles.createButton} type="button">
            <span className={styles.plus} aria-hidden="true">
              +
            </span>
            <span>Crear torneo</span>
          </button>
        </div>
      </section>
    </main>
  );
}
