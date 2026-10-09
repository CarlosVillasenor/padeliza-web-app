import type { ComponentPropsWithoutRef } from "react";
import styles from "./Button.module.css";

type ButtonProps = ComponentPropsWithoutRef<"button">;

export default function Button({
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[styles.button, className].filter(Boolean).join(" ")}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
