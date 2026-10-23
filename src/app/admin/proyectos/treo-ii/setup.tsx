"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PropertyInput } from "@/app/admin/property-input";
import type { ProjectUnit } from "@/lib/project-units";
import { projectPrice } from "@/lib/project-units";
import { uploadMediaFile } from "@/lib/media-upload";
import type { StoredImage } from "@/data/property-row";
import { PropertyForm } from "@/app/admin/property-form";
import styles from "@/components/project/project.module.css";
export function TreoSetup({
  locations,
  readOnly,
  seed,
  assets: treoAssets,
  units: treoUnits,
}: {
  locations: string[];
  readOnly: boolean;
  seed: PropertyInput;
  assets: { key: string; src: string; alt: string }[];
  units: ProjectUnit[];
}) {
  const [images, setImages] = useState<StoredImage[] | null>(null),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [label, setLabel] = useState(""),
    [error, setError] = useState("");
  const uploaded = useRef(new Map<string, StoredImage>()),
    controller = useRef<AbortController | null>(null),
    working = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  async function prepare() {
    if (working.current || readOnly) return;
    working.current = true;
    setBusy(true);
    setError("");
    controller.current = new AbortController();
    try {
      for (let i = 0; i < treoAssets.length; i++) {
        const asset = treoAssets[i];
        if (!uploaded.current.has(asset.key)) {
          setLabel(
            `Subiendo imagen ${i + 1} de ${treoAssets.length}: ${asset.alt}`,
          );
          const response = await fetch(asset.src, {
            signal: controller.current.signal,
          });
          if (!response.ok)
            throw new Error(
              "No se pudo recuperar una imagen del proyecto. Reintenta.",
            );
          const blob = await response.blob();
          if (!blob.type.startsWith("image/") || blob.size > 3 * 1024 * 1024)
            throw new Error(
              "Una imagen del proyecto no cumple el formato o tamaño permitido.",
            );
          const file = new File([blob], `treo-ii-${asset.key}.webp`, {
            type: "image/webp",
          });
          const result = await uploadMediaFile(
            file,
            (p) => setProgress(((i + p / 100) / treoAssets.length) * 100),
            controller.current.signal,
          );
          uploaded.current.set(asset.key, {
            path: result.path,
            alt: asset.alt,
          });
        }
        setProgress(((i + 1) / treoAssets.length) * 100);
      }
      setImages(treoAssets.map((a) => uploaded.current.get(a.key)!));
      setLabel(
        "Imágenes guardadas en tu biblioteca. Revisa la ficha antes de guardarla.",
      );
    } catch (e) {
      if (!controller.current.signal.aborted)
        setError(
          e instanceof Error ? e.message : "No se pudo preparar la ficha.",
        );
    } finally {
      working.current = false;
      if (!controller.current.signal.aborted) setBusy(false);
    }
  }
  return (
    <main id="contenido" className={styles.setup}>
      <p className={styles.eyebrow}>Primera propiedad · Material preparado</p>
      <h1>TREO II Residences</h1>
      <p>
        Santiago · Apartamentos en venta · Desde {projectPrice(21449750)} ·{" "}
        {treoUnits.length} unidades en el listado facilitado.
      </p>
      <p className={styles.notice}>
        El sector exacto, la disponibilidad, la entrega y las condiciones están
        por confirmar con Thony. Las imágenes son renders. No se ha publicado
        ninguna propiedad desde esta pantalla.
      </p>
      <div className={styles.setupRenders}>
        {treoAssets.slice(0, 3).map((a) => (
          <figure key={a.key}>
            <Image
              src={a.src}
              alt={a.alt}
              fill
              sizes="(max-width: 800px) 45vw, 30vw"
            />
          </figure>
        ))}
      </div>
      <div className={styles.setupActions}>
        <Link
          className={styles.secondary}
          href="/admin/proyectos/treo-ii/vista-previa"
        >
          Ver presentación privada
        </Link>
        <Link className={styles.secondary} href="/admin">
          Volver al panel
        </Link>
      </div>
      <details>
        <summary>Revisar unidades y precios del material recibido</summary>
        <ul>
          {treoUnits.map((u) => (
            <li key={u.unit}>
              {u.unit} · Edificio {u.building} · {u.area} m² · {u.bedrooms}{" "}
              habitaciones · {u.bathrooms} baños · {u.parking} parqueos ·{" "}
              {projectPrice(u.priceMinorUnits)}
            </li>
          ))}
        </ul>
      </details>
      {readOnly ? (
        <p className={styles.notice}>
          Preview: la presentación puede revisarse. La preparación y publicación
          se realizan desde el panel del sitio publicado.
        </p>
      ) : (
        !images && (
          <div>
            <button
              type="button"
              className={styles.primary}
              disabled={busy}
              onClick={() => void prepare()}
            >
              {busy
                ? "Preparando imágenes…"
                : error
                  ? "Reintentar preparación"
                  : "Preparar imágenes y ficha"}
            </button>
            <p className={styles.muted}>
              Este paso guarda los renders en tu biblioteca. Después podrás
              revisar y guardar la propiedad con el formulario habitual. No
              sustituye fichas existentes.
            </p>
          </div>
        )
      )}
      {busy && (
        <progress
          max={100}
          value={progress}
          aria-label="Progreso real de subida de imágenes"
        />
      )}
      {label && <p role="status">{label}</p>}
      {error && (
        <p role="alert" className={styles.notice}>
          {error} Las imágenes completadas se conservan para reintentar.
        </p>
      )}
      {images && (
        <div className={styles.setupForm}>
          <h2>Revisa y guarda la propiedad</h2>
          <p>
            La casilla «Publicada» controla si aparecerá en la web. Puedes
            desmarcarla para guardar un borrador.
          </p>
          <PropertyForm initial={{ ...seed, images }} locations={locations} />
        </div>
      )}
    </main>
  );
}
