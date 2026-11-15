"use client";

import { useState } from "react";
import { parseReelUrl, type ReelSettings } from "@/lib/instagram";
import styles from "./admin.module.css";

type Status =
  | { state: "ok"; permalink: string; publishedAt: string | null }
  | { state: "not_configured" }
  | { state: "no_reels" }
  | { state: "error"; detail: string };

const describe = (status: Status) =>
  status.state === "ok"
    ? `Conectado. Último reel: ${status.permalink}${status.publishedAt ? ` (${new Date(status.publishedAt).toLocaleDateString("es-DO")})` : ""}.`
    : status.state === "not_configured"
      ? "Sin conectar: falta el token de la API oficial en el servidor. Mientras tanto se usa el enlace manual."
      : status.state === "no_reels"
        ? "Conectado, pero la cuenta no devuelve ningún reel."
        : `Error de conexión: ${status.detail} Se usa el enlace manual hasta reconectar.`;

/** Reel de Instagram: automático (API oficial), enlace manual u oculto. */
export function ReelSettingsFields({
  value,
  onChange,
}: {
  value: ReelSettings;
  onChange: (next: ReelSettings) => void;
}) {
  const [status, setStatus] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const parsed = value.url ? parseReelUrl(value.url) : null;
  const check = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/admin/instagram", { cache: "no-store" });
      const body = await response.json();
      setStatus(
        response.ok ? describe(body as Status) : body.error || "No se pudo comprobar.",
      );
    } catch {
      setStatus("No se pudo comprobar la conexión.");
    }
    setChecking(false);
  };
  return (
    <fieldset className={styles.fieldset}>
      <legend>Reel de Instagram</legend>
      <p className={styles.hint}>
        Se muestra pequeño y sin sonido junto a la presentación. La opción
        automática usa la API oficial de Instagram y requiere que el
        propietario conecte la cuenta; el enlace manual funciona siempre.
      </p>
      <label className={styles.field}>
        <span>Qué mostrar</span>
        <select
          value={value.mode}
          onChange={(event) =>
            onChange({ ...value, mode: event.target.value as ReelSettings["mode"] })
          }
        >
          <option value="auto">Último reel automático (con enlace de reserva)</option>
          <option value="manual">Solo el enlace que indique</option>
          <option value="off">No mostrar ningún reel</option>
        </select>
      </label>
      {value.mode !== "off" && (
        <label className={styles.field}>
          <span>Enlace del reel</span>
          <input
            type="url"
            inputMode="url"
            placeholder="https://www.instagram.com/reel/…"
            value={value.url}
            onChange={(event) => onChange({ ...value, url: event.target.value })}
          />
          <small role="status">
            {!value.url
              ? value.mode === "manual"
                ? "Pega el enlace del reel para poder guardarlo."
                : "Opcional: se usa si la conexión automática no está disponible."
              : parsed
                ? `Enlace válido: ${parsed.permalink}`
                : "No es un enlace de reel de instagram.com."}
          </small>
        </label>
      )}
      {value.mode === "auto" && (
        <p>
          <button
            type="button"
            className={styles.linkButton}
            onClick={check}
            disabled={checking}
          >
            {checking ? "Comprobando…" : "Comprobar conexión con Instagram"}
          </button>
        </p>
      )}
      {status && (
        <p className={styles.hint} role="status" data-reel-status>
          {status}
        </p>
      )}
    </fieldset>
  );
}
