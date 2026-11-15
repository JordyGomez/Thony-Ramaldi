"use client";

import { useEffect, useRef, useState } from "react";
import {
  INTRO_COOKIE,
  introAssets,
  introTiming,
  type IntroFrequency,
} from "@/lib/intro";
import type { DoorScene } from "./door-scene";
import styles from "./door-intro.module.css";

type Phase = "poster" | "scene" | "exit" | "done";

/** Evita repetirla al volver a la portada sin recargar el documento. */
let playedInDocument = false;

function initialDocumentIsHome() {
  const [entry] = performance.getEntriesByType(
    "navigation",
  ) as PerformanceNavigationTiming[];
  if (!entry) return false;
  try {
    return new URL(entry.name).pathname === "/";
  } catch {
    return false;
  }
}

function firstPaint() {
  const [paint] = performance.getEntriesByName("first-contentful-paint");
  return paint?.startTime ?? 0;
}

export function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function constrainedDevice() {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  return (
    nav.connection?.saveData === true ||
    /(^|-)2g$/.test(nav.connection?.effectiveType || "") ||
    (nav.deviceMemory !== undefined && nav.deviceMemory < 2)
  );
}

/**
 * Pantalla de carga: puerta de caoba en 3D que se abre hacia la portada.
 * El servidor envía el póster (un cuadro real de la escena) y este componente
 * lo sustituye por el lienzo WebGL cuando está listo. Nunca bloquea el acceso:
 * se puede saltar, respeta el movimiento reducido y tiene un límite absoluto.
 */
export function DoorIntro({
  frequency,
  force = false,
}: {
  frequency: IntroFrequency;
  /** Vista previa del panel: se reproduce aunque ya se haya visto. */
  force?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(() =>
    typeof window !== "undefined" &&
    !force &&
    (playedInDocument || !initialDocumentIsHome())
      ? "done"
      : "poster",
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (phase === "done") return;
    // Solo se ejecuta una vez por montaje: la fase inicial decide si procede.
    playedInDocument = true;
    if (!force && frequency === "session")
      document.cookie = `${INTRO_COOKIE}=1; path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;

    let scene: DoorScene | null = null;
    let ended = false;
    const timers: number[] = [];
    const end = () => {
      if (ended) return;
      ended = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      scene?.dispose();
      scene = null;
      setPhase("done");
    };
    let leaving = false;
    const leave = () => {
      if (ended || leaving) return;
      leaving = true;
      setPhase("exit");
      timers.push(window.setTimeout(end, introTiming.exit));
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      end();
      return;
    }
    const elapsed = () => performance.now() - firstPaint();
    timers.push(
      window.setTimeout(end, Math.max(0, introTiming.deadline - elapsed())),
    );

    const skip = () => end();
    const onVisibility = () => document.hidden && end();
    const events = ["keydown", "pointerdown", "wheel", "touchmove"] as const;
    events.forEach((name) =>
      window.addEventListener(name, skip, { passive: true }),
    );
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", skip);
    const onResize = () => scene?.resize();
    window.addEventListener("resize", onResize);

    const canvas = canvasRef.current;
    if (
      !canvas ||
      !webglAvailable() ||
      constrainedDevice() ||
      elapsed() > introTiming.lateMount
    ) {
      // Sin WebGL o con poco margen: el póster se disuelve hacia la portada.
      timers.push(window.setTimeout(leave, 500));
    } else {
      const budget = window.setTimeout(
        leave,
        Math.max(0, introTiming.readyBudget - elapsed()),
      );
      timers.push(budget);
      import("./door-scene")
        .then(async ({ createDoorScene }) => {
          if (ended) return;
          const coarse = window.matchMedia("(pointer: coarse)").matches;
          scene = createDoorScene(canvas, {
            pixelRatio: Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2),
            quality: coarse ? "low" : "high",
          });
          await scene.ready;
          if (ended || !scene) return;
          if (leaving) return;
          window.clearTimeout(budget);
          setPhase("scene");
          scene.play(() => setPhase("exit")).then(() => end());
        })
        .catch(() => leave());
    }

    return () => {
      events.forEach((name) => window.removeEventListener(name, skip));
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", skip);
      window.removeEventListener("resize", onResize);
      timers.forEach((timer) => window.clearTimeout(timer));
      ended = true;
      scene?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "done") return null;
  return (
    <div className={styles.intro} data-door-intro data-phase={phase}>
      <picture>
        <source
          media="(orientation: portrait)"
          srcSet={introAssets.posterPortrait}
        />
        <img
          className={styles.poster}
          src={introAssets.posterLandscape}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="sync"
        />
      </picture>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      <button type="button" className={styles.skip}>
        Saltar introducción
      </button>
    </div>
  );
}
