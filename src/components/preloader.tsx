"use client";

import { useEffect, useState } from "react";

let playedInMemory = false;

export function Preloader() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || playedInMemory || document.hidden) return;
    playedInMemory = true;
    try {
      if (sessionStorage.getItem("thony-entry")) return;
      sessionStorage.setItem("thony-entry", "seen");
    } catch {
      // La memoria del módulo evita repetirla durante la navegación sin storage.
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    const timeout = window.setTimeout(() => setVisible(false), 2300);
    const stop = () => {
      if (media.matches || document.hidden) setVisible(false);
    };
    media.addEventListener("change", stop);
    document.addEventListener("visibilitychange", stop);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      media.removeEventListener("change", stop);
      document.removeEventListener("visibilitychange", stop);
    };
  }, []);
  if (!visible) return null;
  return (
    <div className="preloader" aria-hidden="true">
      <div className="entry-brand">THONY PAULINO</div>
      <span className="entry-line" />
      <span className="entry-caption">Ramaldi · República Dominicana</span>
    </div>
  );
}
