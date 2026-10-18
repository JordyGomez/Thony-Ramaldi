"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { Property } from "@/data/properties";

const imageKey = (source: Property["images"][number]["src"]) =>
  typeof source === "string" ? source : source.src;

export function Gallery({ images }: { images: Property["images"] }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const move = (offset: number) =>
    setIndex((previous) => (previous + offset + images.length) % images.length);
  useEffect(() => {
    const element = dialog.current;
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((previous) => (previous + 1) % images.length);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((previous) => (previous - 1 + images.length) % images.length);
      }
    };
    element?.addEventListener("keydown", key);
    return () => element?.removeEventListener("keydown", key);
  }, [images.length]);
  const navigation = (
    <>
      <button
        aria-label="Imagen anterior"
        onClick={() => move(-1)}
        className="gallery-arrow previous"
      >
        <ChevronLeft strokeWidth={1.25} />
      </button>
      <button
        aria-label="Imagen siguiente"
        onClick={() => move(1)}
        className="gallery-arrow next"
      >
        <ChevronRight strokeWidth={1.25} />
      </button>
    </>
  );
  return (
    <div className="gallery">
      <div className="gallery-main">
        <Image
          key={imageKey(images[index].src)}
          src={images[index].src}
          alt={images[index].alt}
          fill
          sizes="100vw"
          preload={index === 0}
        />
        <div className="gallery-shade" />
        <span className="gallery-counter" aria-live="polite">
          {index + 1} / {images.length}
        </span>
        {navigation}
        <button
          className="gallery-expand"
          onClick={() => dialog.current?.showModal()}
        >
          <Expand size={16} strokeWidth={1.25} /> Ampliar galería
        </button>
      </div>
      <div
        className="gallery-thumbs"
        role="group"
        aria-label="Imágenes de la galería"
      >
        {images.map((image, i) => (
          <button
            key={imageKey(image.src)}
            onClick={() => setIndex(i)}
            aria-label={`Ver imagen ${i + 1}`}
            aria-pressed={index === i}
            className={index === i ? "selected" : ""}
          >
            <Image src={image.src} alt={image.alt} fill sizes="240px" />
          </button>
        ))}
        <p className="gallery-note">
          Galería ilustrativa. Las imágenes de referencia no representan un
          mismo inmueble real.
        </p>
      </div>
      <dialog ref={dialog} className="lightbox" aria-label="Galería ampliada">
        <button
          className="lightbox-close"
          onClick={() => dialog.current?.close()}
          aria-label="Cerrar galería"
        >
          <X strokeWidth={1.25} />
        </button>
        <div className="lightbox-image">
          <Image
            src={images[index].src}
            alt={images[index].alt}
            fill
            sizes="95vw"
          />
          {navigation}
        </div>
        <p>
          {index + 1} / {images.length} · Imágenes ilustrativas
        </p>
      </dialog>
    </div>
  );
}
