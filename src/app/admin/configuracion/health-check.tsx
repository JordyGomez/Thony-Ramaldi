"use client";
import { useEffect, useState } from "react";
import styles from "../admin.module.css";
type Check = { label: string; ok: boolean; detail: string };
export function HealthCheck() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/health", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error);
      setChecks(result.checks);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo comprobar la conexión.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/health", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error);
        return result;
      })
      .then((result) => {
        setChecks(result.checks);
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
    <section className={styles.form} aria-label="Estado del panel">
      {loading && <p role="status">Comprobando conexión y permisos…</p>}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {checks.map((check) => (
        <div
          key={check.label}
          className={`${styles.notice} ${check.ok ? styles.success : styles.error}`}
        >
          <h2>
            {check.label} · {check.ok ? "Correcto" : "Requiere atención"}
          </h2>
          <p>{check.detail}</p>
        </div>
      ))}
      <button
        type="button"
        className="button"
        disabled={loading}
        onClick={() => void load()}
      >
        Volver a comprobar
      </button>
    </section>
  );
}
