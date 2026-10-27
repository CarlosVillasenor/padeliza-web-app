"use client";

import { useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/shared/components/Button/Button";
import { messages } from "@/shared/i18n";
import styles from "./ErrorModal.module.css";

type ErrorModalProps = {
  message: string;
};

const { common: copy } = messages;

export default function ErrorModal({ message }: ErrorModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onClose={() => router.replace("/")}
    >
      <div className={styles.content}>
        <h2 id={titleId} className={styles.title}>
          {copy.errorModalTitle}
        </h2>
        <p id={messageId} className={styles.message}>
          {message}
        </p>
        <Button
          className={styles.closeButton}
          autoFocus
          onClick={() => dialogRef.current?.close()}
        >
          {copy.returnHome}
        </Button>
      </div>
    </dialog>
  );
}
