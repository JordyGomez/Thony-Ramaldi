import type { ReactNode } from "react";

/** Conserva la composición sin animar ni retrasar el contenido. */
export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "rise" | "image" | "soft";
}) {
  return <div className={className}>{children}</div>;
}
