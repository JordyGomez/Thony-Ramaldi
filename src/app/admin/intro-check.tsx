"use client";

import { useState } from "react";
import { introAssets } from "@/lib/intro";
import { webglAvailable } from "@/components/intro/door-intro";
import styles from "./admin.module.css";

const labels: Record<keyof typeof introAssets, string> = {
  woodColor: "Textura de caoba",
  woodRoughness: "Mapa de brillo de la madera",
  posterLandscape: "Imagen inicial horizontal",
  posterPortrait: "Imagen inicial vertical",
};

type Result = { label: string; ok: boolean; detail: string };

/** Comprueba de verdad los recursos de la introducción desde este navegador. */
export function IntroCheck() {
  const [results, setResults] = useState<Result[] | null>(null);
  const [checking, setChecking] = useState(false);
  const verify = async () => {
    setChecking(true);
    const files = await Promise.all(
      (Object.keys(introAssets) as (keyof typeof introAssets)[]).map(
        async (key): Promise<Result> => {
          try {
            const response = await fetch(introAssets[key], {
              method: "HEAD",
              cache: "no-store",
            });
            return {
              label: labels[key],
              ok: response.ok,
              detail: response.ok
                ? "disponible"
                : `no disponible (${response.status})`,
            };
          } catch {
            return { label: labels[key], ok: false, detail: "sin conexión" };
          }
        },
      ),
    );
    const webgl = webglAvailable();
    setResults([
      ...files,
      {
        label: "WebGL en este navegador",
        ok: webgl,
        detail: webgl
          ? "disponible"
          : "no disponible: aquí se verá la imagen inicial sin 3D",
      },
    ]);
    setChecking(false);
  };
  return (
    <div>
      <p>
        <button
          type="button"
          className={styles.linkButton}
          onClick={verify}
          disabled={checking}
        >
          {checking ? "Verificando…" : "Verificar recursos de la introducción"}
        </button>{" "}
        ·{" "}
        <a
          className={styles.linkButton}
          href="/admin/vista-previa?intro=1"
          target="_blank"
          rel="noopener"
        >
          Previsualizar la introducción
        </a>
      </p>
      {results && (
        <ul className={styles.hint} aria-live="polite" data-intro-check>
          {results.map((result) => (
            <li key={result.label}>
              {result.ok ? "✓" : "✗"} {result.label}: {result.detail}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
