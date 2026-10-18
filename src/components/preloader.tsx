"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import heroImage from "../../public/images/hero.jpg";
import { entryEvents } from "@/lib/motion";
import styles from "./preloader.module.css";

let entryShownWithoutStorage = false;

export function Preloader() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    let stored = false;
    try {
      if (sessionStorage.getItem("thony-entry")) return;
      sessionStorage.setItem("thony-entry", "seen");
      stored = true;
    } catch {
      /* La navegación funciona sin almacenamiento. */
    }
    if (!stored && entryShownWithoutStorage) return;
    entryShownWithoutStorage = true;
    const reveal = () => {
      document.documentElement.dataset.thonyEntry = "ready";
      window.dispatchEvent(new Event(entryEvents.reveal));
    };
    // Se activa solo con JavaScript: un fallo de hidratación nunca oculta la página.
    const frame = requestAnimationFrame(() => {
      if (document.visibilityState === "hidden") return;
      document.documentElement.dataset.thonyEntry = "opening";
      window.dispatchEvent(new Event(entryEvents.start));
      setVisible(true);
    });
    const revealTimeout = window.setTimeout(reveal, 1350);
    const timeout = window.setTimeout(() => setVisible(false), 2300);
    const visibility = () => {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(frame);
        reveal();
        setVisible(false);
      }
    };
    document.addEventListener("visibilitychange", visibility);
    const preference = () => {
      if (media.matches) {
        cancelAnimationFrame(frame);
        clearTimeout(revealTimeout);
        clearTimeout(timeout);
        reveal();
        setVisible(false);
      }
    };
    media.addEventListener("change", preference);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(revealTimeout);
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", preference);
      delete document.documentElement.dataset.thonyEntry;
      window.dispatchEvent(new Event(entryEvents.reveal));
    };
  }, []);
  if (!visible) return null;
  return (
    <div className={`preloader ${styles.scene}`} aria-hidden="true">
      <div className="entry-brand">
        THONY PAULINO <span>RAMALDI</span>
      </div>
      <div className={`door-frame ${styles.frame}`}>
        <Image src={heroImage} alt="" fill sizes="160px" />
        <div className={styles.light} />
        <div className={`door-leaf ${styles.leaf}`}>
          <i />
        </div>
      </div>
      <div className={styles.threshold} />
      <span className="entry-caption">La puerta hacia tu próximo hogar</span>
    </div>
  );
}
