"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, RotateCcw } from "lucide-react";
import {
  prepareMediaFile,
  uploadMediaFile,
  type UploadedMedia,
} from "@/lib/media-upload";
import styles from "./admin.module.css";

type Job = {
  id: string;
  file: File;
  status: "waiting" | "preparing" | "uploading" | "done" | "failed";
  progress: number;
  error?: string;
};
export function MediaUploader({
  onUploaded,
  onBusyChange,
  label = "Añadir fotos",
  multiple = true,
  pdf = false,
}: {
  onUploaded: (media: UploadedMedia) => void;
  onBusyChange?: (busy: boolean) => void;
  label?: string;
  multiple?: boolean;
  pdf?: boolean;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  const working = useRef(false);
  const busyCallback = useRef(onBusyChange);
  useEffect(() => {
    busyCallback.current = onBusyChange;
  }, [onBusyChange]);
  useEffect(
    () => () => {
      active.current?.abort();
      if (working.current) busyCallback.current?.(false);
    },
    [],
  );
  const update = (id: string, change: Partial<Job>) =>
    setJobs((previous) =>
      previous.map((job) => (job.id === id ? { ...job, ...change } : job)),
    );
  const run = async (selected: Job[]) => {
    setBusy(true);
    working.current = true;
    busyCallback.current?.(true);
    active.current = new AbortController();
    try {
      for (const job of selected) {
        if (active.current.signal.aborted) break;
        try {
          update(job.id, {
            status: "preparing",
            error: undefined,
            progress: 0,
          });
          const file = await prepareMediaFile(job.file);
          update(job.id, { status: "uploading" });
          const result = await uploadMediaFile(
            file,
            (progress) => update(job.id, { progress }),
            active.current.signal,
          );
          if (active.current.signal.aborted) break;
          onUploaded(result);
          update(job.id, { status: "done", progress: 100 });
        } catch (error) {
          if (!active.current.signal.aborted)
            update(job.id, {
              status: "failed",
              error:
                error instanceof Error
                  ? error.message
                  : "No se pudo subir el archivo.",
            });
        }
      }
    } finally {
      if (!active.current?.signal.aborted) {
        setBusy(false);
        working.current = false;
        busyCallback.current?.(false);
      }
    }
  };
  return (
    <div className={styles.uploadArea}>
      <label className={styles.upload}>
        <ImagePlus size={25} aria-hidden="true" />{" "}
        {busy ? "Subiendo archivos…" : label}
        <input
          type="file"
          accept={
            pdf
              ? "application/pdf"
              : "image/jpeg,image/png,image/webp,image/avif"
          }
          multiple={multiple}
          disabled={busy}
          onChange={(event) => {
            const selected = Array.from(event.target.files || []).map(
              (file) => ({
                id: crypto.randomUUID(),
                file,
                status: "waiting" as const,
                progress: 0,
              }),
            );
            event.target.value = "";
            if (selected.length) {
              setJobs((previous) => [...previous, ...selected]);
              void run(selected);
            }
          }}
        />
      </label>
      <p className={styles.hint}>
        {pdf
          ? "PDF de hasta 3 MB."
          : "JPG, PNG, WebP o AVIF. Las fotos se optimizan antes de subir; se conserva la transparencia de PNG."}
      </p>
      {jobs.length > 0 && (
        <ul className={styles.uploadJobs} aria-live="polite">
          {jobs.map((job) => (
            <li key={job.id}>
              <span className={styles.fileName}>{job.file.name}</span>
              {job.status === "done" ? (
                <span>Subido</span>
              ) : job.status === "failed" ? (
                <>
                  <p role="alert">{job.error}</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void run([job])}
                  >
                    <RotateCcw size={14} aria-hidden="true" /> Reintentar{" "}
                    {job.file.name}
                  </button>
                </>
              ) : (
                <>
                  <progress
                    max={100}
                    value={job.progress}
                    aria-label={`Subiendo ${job.file.name}`}
                  />
                  <span>
                    {job.status === "preparing"
                      ? "Preparando foto…"
                      : job.status === "waiting"
                        ? "En espera"
                        : job.progress >= 95
                          ? "Guardando en el almacenamiento…"
                          : `${job.progress}%`}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
