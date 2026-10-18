import type { ReactNode } from "react";
export function DepthPlane({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`depth-plane ${className}`}>{children}</div>;
}
