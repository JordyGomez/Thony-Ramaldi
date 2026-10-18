"use client";

import { useEffect, useState } from "react";

export function Preloader() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem("thony-entry")) return;
      sessionStorage.setItem("thony-entry", "seen");
    } catch {
      /* La navegación funciona sin almacenamiento. */
    }
    // Se activa solo con JavaScript: un fallo de hidratación nunca oculta la página.
    const frame = requestAnimationFrame(() => setVisible(true));
    const timeout = window.setTimeout(() => setVisible(false), 2300);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, []);
  if (!visible) return null;
  return (
    <div className="preloader" aria-hidden="true">
      <div className="entry-brand">
        THONY PAULINO <span>RAMALDI</span>
      </div>
      <div className="door-frame">
        <div className="door-leaf">
          <i />
        </div>
      </div>
      <span className="entry-caption">La puerta hacia tu próximo hogar</span>
    </div>
  );
}
