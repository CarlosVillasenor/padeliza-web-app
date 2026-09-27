import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  children: ReactNode;
  icon?: ReactNode;
};

export default function Button({
  children,
  className,
  icon,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[styles.button, className].filter(Boolean).join(" ")}
      type={type}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}
