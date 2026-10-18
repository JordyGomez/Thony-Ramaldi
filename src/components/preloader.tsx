"use client";

import Image from "next/image";
import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { site } from "@/lib/site";
import { entryEvents, entryTiming } from "@/lib/motion";
import { ArchitecturalDoor } from "./architectural-door";

let playedInMemory = false;
type EntryPhase = "hidden" | "opening" | "waiting" | "leaving";

const EntryArtwork = memo(function EntryArtwork() {
  const [logoFailed, setLogoFailed] = useState(false);
  return (
    <>
      <span className="entry-kicker">Ramaldi · Inmobiliaria</span>
      <div className="entry-architecture">
        <ArchitecturalDoor>
          <Image
            src={site.portrait}
            alt=""
            fill
            sizes="(max-width: 700px) 68vw, (max-width: 1100px) 44vw, 360px"
            className="entry-portrait"
          />
        </ArchitecturalDoor>
      </div>
      <div className="entry-identity">
        <span className="entry-label">Tu próximo capítulo</span>
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
      <span className="entry-footer">Una nueva perspectiva de tu próximo espacio.</span>
    </>
  );
});

export function Preloader() {
  const [phase, setPhase] = useState<EntryPhase>("hidden");
  const shouldPlay = useRef<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealSite = () => {
      const changed = document.documentElement.dataset.entryState !== "revealed";
      document.documentElement.dataset.entryState = "revealed";
      document.querySelectorAll(".cinematic-hero, .site-header").forEach((element) => element.setAttribute("data-entry-state", "revealed"));
      if (changed) window.dispatchEvent(new Event(entryEvents.reveal));
    };
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
      ) { revealSite(); return; }
      try {
        if (sessionStorage.getItem("thony-entry")) { revealSite(); return; }
        sessionStorage.setItem("thony-entry", "seen");
      } catch {
        // La memoria del módulo conserva la protección si storage está bloqueado.
      }
      playedInMemory = true;
      shouldPlay.current = true;
    }
    if (!shouldPlay.current || media.matches || document.hidden) { revealSite(); return; }

    document.documentElement.dataset.entryState = "opening";
    window.dispatchEvent(new Event(entryEvents.start));

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
      revealSite();
    };
    const dismiss = () => {
      if (!active) return;
      setPhase("hidden");
      dispose();
    };
    const leave = () => {
      if (!active || closing) return;
      closing = true;
      revealSite();
      setPhase("leaving");
      timers.push(window.setTimeout(dismiss, entryTiming.exit));
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
    }, entryTiming.sequence));
    // Cinco segundos como techo absoluto, también respaldado por CSS.
    timers.push(window.setTimeout(dismiss, entryTiming.deadline));

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
    <div
      className="preloader"
      data-phase={phase}
      aria-hidden="true"
      style={{
        "--entry-fade": `${entryTiming.exit}ms`,
        "--entry-safety-delay": `${entryTiming.deadline - entryTiming.exit}ms`,
      } as CSSProperties}
    >
      <EntryArtwork />
    </div>
  );
}
