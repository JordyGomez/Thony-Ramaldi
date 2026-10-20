"use client";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { SiteMode } from "@/lib/platform";
const Identity = createContext<{ mode: SiteMode; revision: number } | null>(
  null,
);
export function PublicModeProvider({
  mode,
  revision,
  children,
}: {
  mode: SiteMode;
  revision: number;
  children: ReactNode;
}) {
  useEffect(() => {
    let stopped = false;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/platform/identity", { cache: "no-store" });
        if (!r.ok) return;
        const current = await r.json();
        if (
          !stopped &&
          (current.mode !== mode || current.revision !== revision)
        )
          window.location.reload();
      } catch {
        /* Una pérdida de conexión no sustituye contenido por otra identidad. */
      }
    };
    const timer = setInterval(() => void check(), 30000);
    window.addEventListener("pageshow", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener("pageshow", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [mode, revision]);
  return (
    <Identity.Provider value={{ mode, revision }}>{children}</Identity.Provider>
  );
}
/** El App Router puede conservar layouts. No pintar una página de otra identidad. */
export function PublicModeContent({
  mode,
  revision,
  children,
}: {
  mode: SiteMode;
  revision: number;
  children: ReactNode;
}) {
  const identity = useContext(Identity);
  const mismatch =
    !!identity && (identity.mode !== mode || identity.revision !== revision);
  useEffect(() => {
    if (mismatch) window.location.reload();
  }, [mismatch]);
  return mismatch ? null : children;
}
