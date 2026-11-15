"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import { reelEmbedUrl, type PublicReel } from "@/lib/instagram";
import styles from "./instagram-reel.module.css";

/**
 * Reel vertical y discreto. Con la API oficial se reproduce silenciado,
 * en bucle y solo mientras está en pantalla. Con una URL manual se usa el
 * embed oficial, que Instagram no permite reproducir automáticamente: se
 * carga cuando el visitante lo pide.
 */
export function InstagramReel({
  reel,
  handle,
}: {
  reel: PublicReel;
  handle: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const element = video.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduced.matches)
          element.play().catch(() => undefined);
        else element.pause();
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const automatic = reel.source === "auto" && !failed;
  return (
    <aside className={styles.reel} aria-label={`Último reel de ${handle}`}>
      <div className={styles.frame} data-reel-source={reel.source}>
        {automatic ? (
          <video
            ref={video}
            className={styles.media}
            src={reel.videoUrl}
            poster={reel.posterUrl || undefined}
            muted
            loop
            playsInline
            preload="none"
            aria-label={`Reel de ${handle}, sin sonido`}
            onError={() => setFailed(true)}
          />
        ) : reel.source === "manual" && opened ? (
          <iframe
            className={styles.media}
            src={reelEmbedUrl(reel.permalink)}
            title={`Reel de ${handle} en Instagram`}
            loading="lazy"
            allow="encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : reel.source === "manual" ? (
          <button
            type="button"
            className={styles.placeholder}
            onClick={() => setOpened(true)}
          >
            <Play size={22} strokeWidth={1.25} aria-hidden="true" />
            <span>Ver reel</span>
          </button>
        ) : (
          <a
            className={styles.placeholder}
            href={reel.permalink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Play size={22} strokeWidth={1.25} aria-hidden="true" />
            <span>Ver en Instagram</span>
          </a>
        )}
      </div>
      <p className={styles.caption}>
        <span>Último reel</span>
        <a href={reel.permalink} target="_blank" rel="noopener noreferrer">
          {handle} <ArrowUpRight size={14} strokeWidth={1.25} aria-hidden="true" />
        </a>
      </p>
    </aside>
  );
}
