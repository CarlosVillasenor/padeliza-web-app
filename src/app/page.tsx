import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import TournamentList from "@/features/tournaments/components/TournamentList";
import { messages } from "@/shared/i18n";
import styles from "./page.module.css";

const copy = messages.home;

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.appShell} aria-labelledby="tournaments-title">
        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label={copy.brandLabel}>
            <Image
              src="/images/branding/isotype.png"
              alt={copy.logoAlt}
              width={32}
              height={32}
            />
            <span>{messages.common.appName}</span>
          </Link>

          <nav
            className={styles.headerActions}
            aria-label={copy.mainActionsLabel}
          >
            <button
              className={styles.iconButton}
              type="button"
              aria-label={copy.viewTournaments}
            ></button>
            <button
              className={styles.iconButton}
              type="button"
              aria-label={copy.moreOptions}
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
            {copy.title}
          </h1>
          <TournamentList
            emptyState={
              <div className={styles.emptyState}>
                <Image
                  className={styles.illustration}
                  src="/images/illustrations/empty-tournaments.png"
                  alt={copy.emptyState.illustrationAlt}
                  width={1521}
                  height={1034}
                  loading="eager"
                />
                <div className={styles.copy}>
                  <h2>{copy.emptyState.title}</h2>
                  <p>
                    {copy.emptyState.descriptionLines.map((line, index) => (
                      <Fragment key={line}>
                        {index > 0 && <br />}
                        {line}
                      </Fragment>
                    ))}
                  </p>
                </div>
              </div>
            }
          />
        </div>
      </section>
    </main>
  );
}
