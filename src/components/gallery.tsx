"use client";
import { useExperienceReducedMotion } from "./site-provider";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Expand,
  ImageOff,
  RotateCcw,
  X,
} from "lucide-react";
import type { Property } from "@/data/properties";
import { editorialEase, motionTiming } from "@/lib/motion";
import styles from "./gallery.module.css";

const imageKey = (source: Property["images"][number]["src"]) =>
  typeof source === "string" ? source : source.src;

// "photo": fotografías reales de la propiedad, sin aviso de procedencia.
type GalleryKind = "illustrative" | "project-render" | "photo";

function GalleryImage({
  image,
  kind,
  expanded = false,
  preload = false,
}: {
  image: Property["images"][number];
  kind: GalleryKind;
  expanded?: boolean;
  preload?: boolean;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const reduced = useExperienceReducedMotion();
  const original = imageKey(image.src);
  const isProjectRender = kind === "project-render";
  // A retry requests the local original, independently of an optimizer failure.
  const source = attempt
    ? `${original}${original.includes("?") ? "&" : "?"}gallery-retry=${attempt}`
    : image.src;

  return (
    <motion.div
      className={`${styles.imageLayer} ${expanded ? styles.contained : ""}`}
      initial={false}
      animate={
        !reduced && status === "ready"
          ? { opacity: [0.72, 1], scale: [1.018, 1] }
          : { opacity: 1, scale: 1 }
      }
      transition={{ duration: motionTiming.normal, ease: editorialEase }}
    >
      <Image
        key={attempt}
        src={source}
        alt={image.alt}
        fill
        sizes={expanded ? "95vw" : "100vw"}
        preload={preload && attempt === 0}
        unoptimized={
          attempt > 0 ||
          (typeof image.src === "string" &&
            image.src.startsWith("/api/platform/media/"))
        }
        className={status === "error" ? styles.unavailable : undefined}
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
      />
      {status === "loading" && (
        <span className={styles.loading} role="status" data-gallery-interactive>
          {isProjectRender ? "Cargando render…" : "Cargando fotografía…"}
        </span>
      )}
      {status === "error" && (
        <div className={styles.error} data-gallery-interactive>
          <ImageOff size={26} strokeWidth={1.25} aria-hidden="true" />
          <p role="status">
            {isProjectRender
              ? "No pudimos cargar este render."
              : "No pudimos cargar esta fotografía."}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              setAttempt((previous) => previous + 1);
            }}
          >
            <RotateCcw size={15} aria-hidden="true" />{" "}
            {isProjectRender ? "Reintentar render" : "Reintentar fotografía"}
          </button>
          <a href={original} target="_blank" rel="noopener noreferrer">
            Abrir archivo original <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      )}
    </motion.div>
  );
}

export function Gallery({
  images,
  kind = "illustrative",
  projectName,
}: {
  images: Property["images"];
  kind?: GalleryKind;
  projectName?: string;
}) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number; time: number } | null>(null);
  const helpId = useId();
  const isProjectRender = kind === "project-render";
  const isPhoto = kind === "photo";
  const move = (offset: number) =>
    setIndex((previous) => (previous + offset + images.length) % images.length);

  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [expanded]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setIndex(event.key === "Home" ? 0 : images.length - 1);
    }
  };
  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (event.touches.length !== 1 || target.closest("button, a")) {
      touch.current = null;
      return;
    }
    touch.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      time: Date.now(),
    };
  };
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touch.current;
    touch.current = null;
    if (!start || !event.changedTouches.length) return;
    const x = event.changedTouches[0].clientX - start.x;
    const y = event.changedTouches[0].clientY - start.y;
    if (
      Math.abs(x) > 48 &&
      Math.abs(x) > Math.abs(y) * 1.5 &&
      Date.now() - start.time < 800
    ) {
      move(x < 0 ? 1 : -1);
    }
  };
  const navigation = (
    <>
      <button
        type="button"
        aria-label="Imagen anterior"
        onClick={() => move(-1)}
        className="gallery-arrow previous"
        data-gallery-interactive
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Imagen siguiente"
        onClick={() => move(1)}
        className="gallery-arrow next"
        data-gallery-interactive
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </>
  );
  return (
    <div
      className={`gallery ${styles.root}`}
      role="region"
      aria-label={
        isProjectRender
          ? "Galería de renders del proyecto"
          : isPhoto
            ? "Galería de fotografías"
            : "Galería de fotografías ilustrativas"
      }
      aria-describedby={helpId}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div
        className="gallery-main"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => {
          touch.current = null;
        }}
      >
        <GalleryImage
          key={imageKey(images[index].src)}
          image={images[index]}
          kind={kind}
          preload={index === 0}
        />
        <div className="gallery-shade" />
        {!isPhoto && (
          <span className={styles.sourceNote}>
            {isProjectRender
              ? `Render del proyecto${projectName ? ` · ${projectName}` : ""}`
              : "Fotografía ilustrativa"}
          </span>
        )}
        <span className="gallery-counter" aria-live="polite" aria-atomic="true">
          {index + 1} / {images.length}
        </span>
        {navigation}
        <button
          ref={expandButton}
          type="button"
          className="gallery-expand"
          onClick={() => {
            dialog.current?.showModal();
            setExpanded(true);
          }}
          aria-label="Ampliar galería"
          data-gallery-interactive
        >
          <Expand size={18} aria-hidden="true" /> Ampliar galería
        </button>
      </div>
      <div
        className="gallery-thumbs"
        role="group"
        aria-label="Imágenes de la galería"
        data-gallery-interactive
      >
        {images.map((image, i) => (
          <button
            type="button"
            key={imageKey(image.src)}
            onClick={() => setIndex(i)}
            aria-label={`Ver imagen ${i + 1}`}
            aria-pressed={index === i}
            className={index === i ? "selected" : ""}
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="160px"
              unoptimized={
                typeof image.src === "string" &&
                image.src.startsWith("/api/platform/media/")
              }
            />
            <span className={styles.thumbIndex} aria-hidden="true">
              0{i + 1}
            </span>
          </button>
        ))}
      </div>
      <p className={styles.help} id={helpId} data-gallery-interactive>
        Usa las flechas del teclado o desliza para explorar.
      </p>
      {!isPhoto && (
        <p className="gallery-note">
          {isProjectRender
            ? "Renders del proyecto · folleto original. No son fotografías de la unidad en alquiler. Los muebles y accesorios mostrados podrían no estar incluidos."
            : "Galería ilustrativa. Las imágenes de referencia no representan un mismo inmueble real."}
        </p>
      )}
      <noscript>
        <style>{`.gallery [data-gallery-interactive] { display: none !important; }`}</style>
        <div className={styles.fallback}>
          {images.map((image, i) => (
            <a key={imageKey(image.src)} href={imageKey(image.src)}>
              Ver {isProjectRender ? "render" : "fotografía"} {i + 1}
            </a>
          ))}
        </div>
      </noscript>
      <dialog
        ref={dialog}
        className={`lightbox ${styles.lightbox}`}
        aria-label="Galería ampliada"
        onClose={() => {
          setExpanded(false);
          expandButton.current?.focus();
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          ) {
            event.currentTarget.close();
          }
        }}
      >
        <button
          type="button"
          className="lightbox-close"
          onClick={() => dialog.current?.close()}
          aria-label="Cerrar galería"
        >
          <X aria-hidden="true" />
        </button>
        <div
          className="lightbox-image"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={() => {
            touch.current = null;
          }}
        >
          {expanded && (
            <GalleryImage
              key={imageKey(images[index].src)}
              image={images[index]}
              kind={kind}
              expanded
            />
          )}
          {navigation}
        </div>
        <p aria-live="polite" aria-atomic="true">
          {index + 1} / {images.length} ·{" "}
          {isProjectRender
            ? "Renders del proyecto"
            : isPhoto
              ? "Fotografías"
              : "Imágenes ilustrativas"}
        </p>
      </dialog>
    </div>
  );
}
