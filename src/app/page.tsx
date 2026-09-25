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
            <PadelIllustration />
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

function PadelIllustration() {
  return (
    <svg
      className={styles.illustration}
      viewBox="0 0 440 250"
      role="img"
      aria-label="Raqueta y pelota de pádel"
    >
      <ellipse className={styles.shadow} cx="220" cy="226" rx="122" ry="12" />
      <g className={styles.court}>
        <path d="M43 92h354v91H43z" />
        <path d="M43 115h354M43 140h354M43 165h354M87 92v91M132 92v91M177 92v91M220 92v91M264 92v91M309 92v91M354 92v91" />
        <path className={styles.post} d="M34 75v111M406 75v111" />
      </g>
      <g className={styles.racket}>
        <path
          className={styles.racketFrame}
          d="M133 19c31-19 70 5 75 44 5 36-15 57-46 70l-37 16c-12-28-26-54-22-79 3-21 13-41 30-51Z"
        />
        <path
          className={styles.racketFace}
          d="M137 30c24-15 54 5 58 35 4 28-14 43-39 53l-22 9c-9-21-20-42-17-61 2-16 8-29 20-36Z"
        />
        <path className={styles.handle} d="m135 145-31 70" />
        <path className={styles.grip} d="m101 211 15 7" />
        <g className={styles.holes}>
          <circle cx="135" cy="46" r="4" />
          <circle cx="154" cy="42" r="4" />
          <circle cx="172" cy="51" r="4" />
          <circle cx="124" cy="62" r="4" />
          <circle cx="143" cy="61" r="4" />
          <circle cx="162" cy="68" r="4" />
          <circle cx="180" cy="72" r="4" />
          <circle cx="120" cy="80" r="4" />
          <circle cx="139" cy="82" r="4" />
          <circle cx="158" cy="88" r="4" />
          <circle cx="174" cy="94" r="4" />
          <circle cx="126" cy="99" r="4" />
          <circle cx="145" cy="103" r="4" />
          <circle cx="161" cy="108" r="4" />
        </g>
      </g>
      <g className={styles.ball}>
        <circle cx="255" cy="183" r="39" />
        <path d="M226 177c13-14 31-15 53-2M279 198c-11 16-28 20-48 12" />
      </g>
      <path
        className={styles.spark}
        d="m305 150 8-18M319 165l20-12M319 181l21 2"
      />
    </svg>
  );
}
