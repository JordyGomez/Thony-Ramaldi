"use client";

import { useId, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImagePlus, X } from "lucide-react";
import { propertyOperations, propertyTypes } from "@/data/property-options";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { STORAGE_BUCKET, storagePublicUrl } from "@/lib/supabase/env";
import { saveProperty } from "./actions";
import {
  slugify,
  validatePropertyInput,
  type PropertyInput,
} from "./property-input";
import styles from "./admin.module.css";

const MAX_IMAGE_SIDE = 2400;

// Reduce fotos de móvil (a menudo 4–10 MB) antes de subirlas. Si el navegador
// no puede leer el formato, se sube el archivo original.
async function prepareImage(file: File): Promise<{ blob: Blob; ext: string }> {
  const original = { blob: file, ext: file.name.split(".").pop() || "jpg" };
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return original;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_500_000) return original;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return blob ? { blob, ext: "jpg" } : original;
  } catch {
    return original;
  }
}

const toNumber = (value: string) => {
  if (value.trim() === "") return null;
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) ? number : Number.NaN;
};
const lines = (value: string) => value.split("\n");

export function PropertyForm({
  initial,
  locations,
}: {
  initial: PropertyInput;
  locations: string[];
}) {
  const router = useRouter();
  const [input, setInput] = useState(initial);
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.id));
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);
  const [saving, startSaving] = useTransition();
  const locationsId = useId();
  const errorRef = useRef<HTMLParagraphElement>(null);

  const set = <K extends keyof PropertyInput>(key: K, value: PropertyInput[K]) =>
    setInput((previous) => ({ ...previous, [key]: value }));

  const folder = () => input.slug || slugify(input.title) || "sin-nombre";

  const upload = async (file: File, prefix: string) => {
    const { blob, ext } = await prepareImage(file);
    const path = `${folder()}/${prefix}${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error: uploadError } = await createBrowserSupabase()
      .storage.from(STORAGE_BUCKET)
      .upload(path, blob, { contentType: blob.type || file.type });
    if (uploadError) throw uploadError;
    return path;
  };

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setUploading((count) => count + files.length);
    for (const file of Array.from(files)) {
      try {
        const path = await upload(file, "");
        setInput((previous) => ({
          ...previous,
          images: [...previous.images, { path, alt: "" }],
        }));
      } catch {
        setError(`No se pudo subir «${file.name}». Revisa tu conexión e inténtalo otra vez.`);
      } finally {
        setUploading((count) => count - 1);
      }
    }
  };

  const moveImage = (index: number, offset: -1 | 1) =>
    setInput((previous) => {
      const images = [...previous.images];
      const [image] = images.splice(index, 1);
      images.splice(index + offset, 0, image);
      return { ...previous, images };
    });

  const addBrochure = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("El folleto debe ser un archivo PDF.");
      return;
    }
    setUploading((count) => count + 1);
    try {
      set("brochurePath", await upload(file, "folleto-"));
    } catch {
      setError("No se pudo subir el folleto. Inténtalo otra vez.");
    } finally {
      setUploading((count) => count - 1);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const problem = validatePropertyInput(input);
    if (problem) {
      setError(problem);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setError(null);
    startSaving(async () => {
      const result = await saveProperty(input);
      if (!result.ok) {
        setError(result.error);
        requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <fieldset className={styles.fieldset}>
        <legend>Lo básico</legend>
        <label className={styles.field}>
          Nombre de la propiedad
          <input
            value={input.title}
            onChange={(event) => {
              const title = event.target.value;
              setInput((previous) => ({
                ...previous,
                title,
                slug: slugEdited ? previous.slug : slugify(title),
              }));
            }}
            placeholder="Ejemplo: Villa Mar Azul"
            required
          />
        </label>
        <label className={styles.field}>
          Dirección web
          <input
            value={input.slug}
            onChange={(event) => {
              setSlugEdited(true);
              set("slug", slugify(event.target.value));
            }}
            required
          />
          <small>La ficha se verá en /propiedades/{input.slug || "…"}</small>
        </label>
        <div className={styles.field}>
          Operación
          <div className={styles.radios} role="radiogroup" aria-label="Operación">
            {propertyOperations.map((operation) => (
              <label key={operation} className={styles.radio}>
                <input
                  type="radio"
                  name="operation"
                  checked={input.operation === operation}
                  onChange={() => set("operation", operation)}
                />
                {operation}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.grid2}>
          <label className={styles.field}>
            Tipo
            <select
              value={input.type}
              onChange={(event) =>
                set("type", event.target.value as PropertyInput["type"])
              }
            >
              {propertyTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            {input.operation === "Alquiler" ? "Renta mensual (USD)" : "Precio (USD)"}
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={input.price ?? ""}
              onChange={(event) => set("price", toNumber(event.target.value))}
              placeholder="Solo el número"
              required
            />
          </label>
        </div>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={input.priceProvisional}
            onChange={(event) => set("priceProvisional", event.target.checked)}
          />
          <span>
            El precio es provisional
            <small>La web indicará que está por confirmar.</small>
          </span>
        </label>
        <div className={styles.grid2}>
          <label className={styles.field}>
            Ciudad o zona
            <input
              value={input.location}
              list={locationsId}
              onChange={(event) => set("location", event.target.value)}
              placeholder="Ejemplo: Santiago"
              required
            />
            <datalist id={locationsId}>
              {locations.map((location) => (
                <option key={location} value={location} />
              ))}
            </datalist>
            <small>Aparece en el filtro de ubicación de la web.</small>
          </label>
          <label className={styles.field}>
            Sector o dirección de referencia
            <input
              value={input.neighborhood}
              onChange={(event) => set("neighborhood", event.target.value)}
              placeholder="Ejemplo: Los Cerros de Gurabo"
            />
          </label>
        </div>
        <label className={styles.field}>
          Referencia interna
          <input
            value={input.reference}
            onChange={(event) => set("reference", event.target.value)}
            placeholder="Ejemplo: STI-014"
            required
          />
          <small>Se incluye en el mensaje de WhatsApp para identificarla.</small>
        </label>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Fotos</legend>
        <p className={styles.hint}>
          La primera foto es la portada. Usa las flechas para cambiar el orden y
          describe brevemente qué se ve en cada una.
        </p>
        <div className={styles.photos}>
          {input.images.map((image, index) => (
            <div key={image.path} className={styles.photo}>
              <div className={styles.photoImage}>
                {index === 0 && <span className={styles.cover}>Portada</span>}
                <Image
                  src={storagePublicUrl(image.path)}
                  alt=""
                  fill
                  sizes="220px"
                />
              </div>
              <input
                value={image.alt}
                aria-label={`Descripción de la foto ${index + 1}`}
                placeholder="Qué se ve: sala con vista al jardín…"
                onChange={(event) =>
                  setInput((previous) => ({
                    ...previous,
                    images: previous.images.map((item, i) =>
                      i === index ? { ...item, alt: event.target.value } : item,
                    ),
                  }))
                }
              />
              <div className={styles.photoTools}>
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  aria-label={`Mover la foto ${index + 1} antes`}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "images",
                      input.images.filter((_, i) => i !== index),
                    )
                  }
                  aria-label={`Quitar la foto ${index + 1}`}
                >
                  <X size={16} aria-hidden="true" /> Quitar
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === input.images.length - 1}
                  aria-label={`Mover la foto ${index + 1} después`}
                >
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
          <label className={styles.upload}>
            <ImagePlus size={26} strokeWidth={1.25} aria-hidden="true" />
            {uploading ? `Subiendo ${uploading}…` : "Añadir fotos"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                addImages(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={input.imagesAreRenders}
            onChange={(event) => set("imagesAreRenders", event.target.checked)}
          />
          <span>
            Las imágenes son renders o del folleto
            <small>Márcalo si no son fotos reales de la unidad.</small>
          </span>
        </label>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Características</legend>
        <div className={styles.grid4}>
          {(
            [
              ["bedrooms", "Habitaciones"],
              ["bathrooms", "Baños"],
              ["area", "Superficie (m²)"],
              ["parking", "Parqueos"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className={styles.field}>
              {label}
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={
                  input[key] === null || Number.isNaN(input[key])
                    ? ""
                    : String(input[key])
                }
                onChange={(event) => set(key, toNumber(event.target.value))}
              />
            </label>
          ))}
        </div>
        <p className={styles.hint}>
          Deja vacío lo que esté por confirmar; la web mostrará «Por confirmar».
        </p>
        <label className={styles.field}>
          Descripción
          <textarea
            value={input.description}
            onChange={(event) => set("description", event.target.value)}
            rows={6}
            required
          />
        </label>
        <label className={styles.field}>
          Características destacadas
          <textarea
            value={input.amenities.join("\n")}
            onChange={(event) => set("amenities", lines(event.target.value))}
            rows={4}
            placeholder={"Piscina\nTerraza\nSeguridad 24 horas"}
          />
          <small>Una por línea.</small>
        </label>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>En la web</legend>
        <div className={styles.checks}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={input.published}
              onChange={(event) => set("published", event.target.checked)}
            />
            <span>
              Publicada
              <small>Desmárcala para ocultarla sin borrarla.</small>
            </span>
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={input.featured}
              onChange={(event) => set("featured", event.target.checked)}
            />
            <span>
              Destacada
              <small>Aparece primero en el carrusel.</small>
            </span>
          </label>
          {!input.demo && (
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={input.inPreparation}
                onChange={(event) => set("inPreparation", event.target.checked)}
              />
              <span>
                Ficha en preparación
                <small>Faltan datos por confirmar (unidad, precio…).</small>
              </span>
            </label>
          )}
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={input.demo}
              onChange={(event) => set("demo", event.target.checked)}
            />
            <span>
              Ficha de demostración
              <small>Solo para ejemplos ficticios.</small>
            </span>
          </label>
        </div>
        <label className={styles.field}>
          Orden (opcional)
          <input
            type="number"
            inputMode="numeric"
            value={input.sortOrder ?? ""}
            onChange={(event) => {
              const value = toNumber(event.target.value);
              set("sortOrder", value === null || Number.isNaN(value) ? null : Math.round(value));
            }}
          />
          <small>Las de número menor aparecen antes. Vacío: las más nuevas primero.</small>
        </label>
      </fieldset>

      <details className={styles.fieldset} open={Boolean(input.brochurePath || input.projectName)}>
        <summary className={styles.summary}>
          Folleto y datos del proyecto (opcional)
        </summary>
        <div className={styles.field}>
          Folleto en PDF
          {input.brochurePath ? (
            <span className={styles.photoTools}>
              <a href={storagePublicUrl(input.brochurePath)} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
                Ver folleto subido
              </a>
              <button type="button" onClick={() => set("brochurePath", null)}>
                <X size={16} aria-hidden="true" /> Quitar
              </button>
            </span>
          ) : (
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                addBrochure(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          )}
        </div>
        {input.brochurePath && (
          <label className={styles.field}>
            Texto del enlace al folleto
            <input
              value={input.brochureLabel}
              onChange={(event) => set("brochureLabel", event.target.value)}
              placeholder="Ver folleto del proyecto (PDF)"
            />
          </label>
        )}
        <label className={styles.field}>
          Nombre corto del proyecto
          <input
            value={input.projectName}
            onChange={(event) => set("projectName", event.target.value)}
            placeholder="Ejemplo: Alberobello"
          />
        </label>
        <label className={styles.field}>
          Datos del proyecto
          <textarea
            value={input.projectFacts.join("\n")}
            onChange={(event) => set("projectFacts", lines(event.target.value))}
            rows={4}
          />
          <small>Uno por línea. Si hay datos aquí, sustituyen a las características destacadas en la ficha.</small>
        </label>
        <label className={styles.field}>
          Tipologías del proyecto
          <textarea
            value={input.projectTypologies.join("\n")}
            onChange={(event) => set("projectTypologies", lines(event.target.value))}
            rows={3}
          />
          <small>Una por línea.</small>
        </label>
        <label className={styles.field}>
          Nota sobre lo pendiente de confirmar
          <textarea
            value={input.confirmationNote}
            onChange={(event) => set("confirmationNote", event.target.value)}
            rows={3}
          />
        </label>
      </details>

      <div className={styles.footer}>
        <p
          ref={errorRef}
          tabIndex={-1}
          role={error ? "alert" : undefined}
          className={error ? styles.danger : undefined}
        >
          {error ??
            (uploading
              ? "Espera a que terminen de subirse los archivos…"
              : "Los cambios se ven en la web en cuanto guardas.")}
        </p>
        <div className={styles.footerActions}>
          <Link href="/admin" className="button">
            Cancelar
          </Link>
          <button
            type="submit"
            className="button button-solid"
            disabled={saving || uploading > 0}
          >
            {saving ? "Guardando…" : initial.id ? "Guardar cambios" : "Publicar propiedad"}
          </button>
        </div>
      </div>
    </form>
  );
}
