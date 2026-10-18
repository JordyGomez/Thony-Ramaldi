"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FileText, Check, RefreshCw } from "lucide-react";
import { MediaUploader } from "./media-uploader";
import type { UploadedMedia } from "@/lib/media-upload";
import styles from "./admin.module.css";

type Media = UploadedMedia & { name: string; createdAt: string };
export function MediaLibrary({
  onSelect,
  imagesOnly = false,
}: {
  onSelect?: (media: Media) => void;
  imagesOnly?: boolean;
}) {
  const [files, setFiles] = useState<Media[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [copied, setCopied] = useState("");
  const load = async (offset = 0) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/media?offset=${offset}`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error);
      setFiles((previous) =>
        offset ? [...previous, ...result.files] : result.files,
      );
      setMore(result.hasMore);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo leer la biblioteca.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/media", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error);
        return result;
      })
      .then((result) => {
        setFiles(result.files);
        setMore(result.hasMore);
        setLoading(false);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setError(error.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);
  return (
    <div className={styles.library}>
      {!onSelect && <MediaUploader onUploaded={() => void load()} />}
      <div className={styles.libraryHeading}>
        <p className={styles.hint}>
          Archivos subidos desde el panel. Las fotos antiguas se conservan en
          sus propiedades.
        </p>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw size={15} aria-hidden="true" /> Actualizar biblioteca
        </button>
      </div>
      {error && (
        <p className={`${styles.notice} ${styles.error}`} role="alert">
          {error}
        </p>
      )}
      {loading && <p role="status">Cargando archivos…</p>}
      {!loading && !error && !files.length && (
        <p className={styles.hint}>
          Todavía no hay archivos en la biblioteca. Sube la primera foto.
        </p>
      )}
      <div className={styles.mediaGrid}>
        {files
          .filter((file) => !imagesOnly || file.mime.startsWith("image/"))
          .map((file) => (
            <div className={styles.mediaCard} key={file.path}>
              <div className={styles.mediaPreview}>
                {file.mime.startsWith("image/") ? (
                  <Image
                    src={file.url}
                    alt="Archivo de la biblioteca"
                    fill
                    sizes="180px"
                  />
                ) : (
                  <FileText size={36} aria-label="Documento PDF" />
                )}
              </div>
              <p>
                {file.mime.startsWith("image/") ? "Imagen" : "PDF"} ·{" "}
                {Math.ceil(file.size / 1024)} KB
              </p>
              <div className={styles.photoTools}>
                {onSelect ? (
                  <button type="button" onClick={() => onSelect(file)}>
                    <Check size={14} aria-hidden="true" /> Usar imagen
                  </button>
                ) : (
                  <>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(file.url);
                          setCopied(file.path);
                        } catch {
                          setError(
                            "No se pudo copiar el enlace. Abre el archivo y copia su dirección.",
                          );
                        }
                      }}
                    >
                      {copied === file.path
                        ? "Enlace copiado"
                        : "Copiar enlace"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
      </div>
      {more && (
        <button
          type="button"
          className="button"
          disabled={loading}
          onClick={() => void load(files.length)}
        >
          Cargar más archivos
        </button>
      )}
    </div>
  );
}
export function ImageSetting({
  label,
  value,
  onChange,
  onBusyChange,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onBusyChange: (busy: boolean) => void;
  optional?: boolean;
}) {
  const [library, setLibrary] = useState(false);
  return (
    <fieldset className={styles.fieldset}>
      <legend>{label}</legend>
      {value ? (
        <div className={styles.settingImage}>
          <Image
            src={value}
            alt={label}
            width={420}
            height={240}
            style={{ objectFit: "contain" }}
          />
          {optional && (
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => onChange("")}
            >
              Quitar imagen
            </button>
          )}
        </div>
      ) : (
        <p className={styles.hint}>Sin imagen seleccionada.</p>
      )}
      <MediaUploader
        label={`Subir ${label.toLowerCase()}`}
        multiple={false}
        onBusyChange={onBusyChange}
        onUploaded={(media) => onChange(media.url)}
      />
      <button
        className={styles.linkButton}
        type="button"
        aria-expanded={library}
        onClick={() => setLibrary(!library)}
      >
        {library ? "Cerrar biblioteca" : "Elegir de la biblioteca"}
      </button>
      {library && (
        <MediaLibrary
          imagesOnly
          onSelect={(media) => {
            onChange(media.url);
            setLibrary(false);
          }}
        />
      )}
    </fieldset>
  );
}
