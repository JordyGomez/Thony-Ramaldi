import type { ReactNode } from "react";
import styles from "./architectural-door.module.css";

/** Arquitectura de marca, no representación de una propiedad en venta. */
export function ArchitecturalDoor({
  children,
  variant = "entry",
}: {
  children?: ReactNode;
  variant?: "entry" | "hero" | "empty";
}) {
  return (
    <div className={`${styles.scene} ${styles[variant]}`} data-door-scene={variant}>
      <span className={styles.ambient} aria-hidden="true" />
      <div className={styles.surround}>
        <div className={styles.aperture}>
          <div className={styles.presence}>{children}</div>
          <div className={`${styles.leaf} entry-door`} aria-hidden="true">
            <span className={styles.front}>
              <span className={styles.inlay} />
              <span className={styles.handle} />
            </span>
            <span className={styles.edge} />
            <span className={styles.back} />
          </div>
        </div>
        <span className={styles.threshold} aria-hidden="true" />
      </div>
      <span className={styles.floor} aria-hidden="true" />
    </div>
  );
}
