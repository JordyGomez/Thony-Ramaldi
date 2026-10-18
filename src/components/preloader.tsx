"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

let playedInMemory = false;
type EntryPhase = "hidden" | "opening" | "waiting" | "leaving";

export function Preloader() {
  const [phase, setPhase] = useState<EntryPhase>("hidden");
  const [logoFailed, setLogoFailed] = useState(false);
  const shouldPlay = useRef<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (shouldPlay.current === null) {
      shouldPlay.current = false;
      // La home ya monta este componente. El documento inicial evita activarlo
      // al llegar a ella por SPA desde una ficha, incluso sin sessionStorage.
      const navigation = performance.getEntriesByType("navigation")[0];
      if (
        media.matches ||
        playedInMemory ||
        document.hidden ||
        window.location.pathname !== "/" ||
        !navigation ||
        new URL(navigation.name).pathname !== "/"
      ) return;
      try {
        if (sessionStorage.getItem("thony-entry")) return;
        sessionStorage.setItem("thony-entry", "seen");
      } catch {
        // La memoria del módulo conserva la protección si storage está bloqueado.
      }
      playedInMemory = true;
      shouldPlay.current = true;
    }
    if (!shouldPlay.current || media.matches || document.hidden) return;

    let active = true;
    let sequenceFinished = false;
    let ready = false;
    let closing = false;
    const timers: number[] = [];
    const controller = new AbortController();
    const { signal } = controller;
    const frame = requestAnimationFrame(() => setPhase("opening"));

    const dispose = () => {
      active = false;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      controller.abort();
    };
    const dismiss = () => {
      if (!active) return;
      setPhase("hidden");
      dispose();
    };
    const leave = () => {
      if (!active || closing) return;
      closing = true;
      setPhase("leaving");
      timers.push(window.setTimeout(dismiss, 600));
    };

    // Solo se espera lo que necesita la primera pantalla; no imágenes lazy,
    // analytics ni recursos del resto del catálogo. Un error permite continuar.
    const hero = document.querySelector<HTMLImageElement>(".hero-image");
    const heroReady = new Promise<void>((resolve) => {
      if (!hero) return resolve();
      const finish = () => {
        if (!hero.naturalWidth) return resolve();
        hero.decode().catch(() => undefined).then(() => resolve());
      };
      if (hero.complete) finish();
      else {
        hero.addEventListener("load", finish, { once: true, signal });
        hero.addEventListener("error", finish, { once: true, signal });
      }
    });
    Promise.allSettled([heroReady, document.fonts.ready]).then(() => {
      if (!active) return;
      ready = true;
      if (sequenceFinished) leave();
    });
    timers.push(window.setTimeout(() => {
      sequenceFinished = true;
      if (ready) leave();
      else if (active) setPhase("waiting");
    }, 1700));
    // Cinco segundos como techo absoluto, también respaldado por CSS.
    timers.push(window.setTimeout(dismiss, 5000));

    const stopIfUnavailable = () => {
      if (media.matches || document.hidden) dismiss();
    };
    media.addEventListener("change", stopIfUnavailable, { signal });
    document.addEventListener("visibilitychange", stopIfUnavailable, { signal });
    // La introducción es decorativa: interactuar da paso al contenido de inmediato.
    document.addEventListener("pointerdown", dismiss, { signal, capture: true });
    document.addEventListener("keydown", dismiss, { signal, capture: true });
    document.addEventListener("wheel", dismiss, { signal, passive: true });
    return dispose;
  }, []);

  if (phase === "hidden") return null;
  return (
    <div className="preloader" data-phase={phase} aria-hidden="true">
      <div className="entry-architecture">
        <span className="entry-door" />
      </div>
      {site.logo && !logoFailed ? (
        <Image
          src={site.logo}
          alt="Ramaldi"
          width={260}
          height={96}
          className="entry-logo"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <div className="entry-brand">THONY PAULINO</div>
      )}
      <span className="entry-line" />
      <span className="entry-caption">Ramaldi · República Dominicana</span>
    </div>
  );
}
