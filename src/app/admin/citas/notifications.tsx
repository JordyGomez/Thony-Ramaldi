"use client";
import { useEffect, useState } from "react";
import { agendaGet, agendaPost } from "@/components/appointments/admin-api";
import {
  notificationStatuses,
  notificationTitles,
  rdDate,
  rdTime,
  type AgendaWorkspace,
  type IntegrationStatus,
} from "@/lib/appointments/types";

import styles from "@/components/appointments/admin.module.css";
import ui from "@/components/appointments/agenda.module.css";
export function NotificationCenter({
  initial,
  readOnly,
  onOpen,
  onProcessed,
}: {
  initial: AgendaWorkspace;
  readOnly: boolean;
  onOpen: (id: string) => void;
  onProcessed: () => void;
}) {
  const [health, setHealth] = useState(initial.integrations),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [scope, setScope] = useState(""),
    [result, setResult] = useState<{
      scope: string;
      data: AgendaWorkspace;
    } | null>(null),
    [status, setStatus] = useState("");
  const data = scope
    ? result?.scope === scope
      ? result.data
      : initial
    : initial.notifications
      ? initial
      : result?.scope === ""
        ? result.data
        : initial;
  const loading = scope
    ? result?.scope !== scope
    : !initial.notifications && result?.scope !== "";
  useEffect(() => {
    if (scope || initial.notifications) return;
    const controller = new AbortController();
    agendaGet<AgendaWorkspace>("kind=notifications", controller.signal)
      .then((value) => setResult({ scope: "", data: { ...initial, ...value } }))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [initial, scope]);
  const check = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await agendaGet<{ integrations: IntegrationStatus }>(
        "kind=integrations",
      );
      setHealth(r.integrations);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo verificar la configuración.",
      );
    } finally {
      setBusy(false);
    }
  };
  const process = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await agendaPost<{ processed: number }>({ action: "process" });
      setNotice(
        `Procesados ${r.processed} avisos vencidos. Consulta sus estados; procesar no equivale a entregar.`,
      );
      onProcessed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar la cola.");
    } finally {
      setBusy(false);
    }
  };
  const inspect = async (appointmentId: string) => {
    setBusy(true);
    try {
      const r = await agendaGet<AgendaWorkspace>(
        "kind=notifications&appointment=" + appointmentId,
      );
      setResult({ scope: appointmentId, data: r });
      setScope(appointmentId);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo consultar el historial.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className={ui.panel} style={{ marginTop: 28 }}>
      <h2>Comunicaciones y cola de avisos</h2>
      <p className={ui.muted}>
        Un aviso en cola todavía no se ha enviado. «Aceptado por el proveedor»
        confirma la recepción de la API; «Entregado» requiere un webhook
        firmado.
      </p>
      {health && (
        <div className={styles.twoColumns}>
          {(["email", "whatsapp"] as const).map((channel) => (
            <div className={styles.integration} key={channel}>
              <strong>
                {channel === "email"
                  ? "Correo · Resend"
                  : "WhatsApp · Meta oficial"}
              </strong>
              <span className={ui.badge}>
                {health[channel].ready
                  ? "Proveedor verificado"
                  : health[channel].configured
                    ? "Configurado, por verificar"
                    : "Desactivado"}
              </span>
              <p>{health[channel].reason}</p>
            </div>
          ))}
        </div>
      )}
      <div className={ui.actions}>
        <button
          type="button"
          className={ui.secondary}
          disabled={busy}
          onClick={() => void check()}
        >
          Verificar integraciones
        </button>
        <button
          type="button"
          className={ui.primary}
          disabled={busy || readOnly}
          onClick={() => void process()}
        >
          Procesar avisos pendientes
        </button>
      </div>
      <p className={ui.muted}>
        El procesamiento manual intenta hasta cuatro avisos vencidos. Los
        recordatorios futuros esperan su fecha. El funcionamiento automático
        depende de Supabase Cron.
      </p>
      {error && (
        <p role="alert" className={`${ui.notice} ${ui.error}`}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className={ui.notice}>
          {notice}
        </p>
      )}
      {scope && (
        <div className={ui.actions}>
          <span className={ui.muted}>Historial de una cita</span>
          <button
            type="button"
            className={ui.secondary}
            onClick={() => {
              setScope("");
            }}
          >
            Ver avisos recientes
          </button>
        </div>
      )}
      <label className={ui.field}>
        Estado del aviso
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          {Object.entries(notificationStatuses).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {(data.notifications || [])
        .filter((j) => !status || j.status === status)
        .map((job) => (
          <details className={styles.job} key={job.id}>
            <summary>
              {notificationTitles[job.event] || job.event} ·{" "}
              {job.channel === "email" ? "Correo" : "WhatsApp"} ·{" "}
              {job.recipient === "owner" ? "Thony" : "Cliente"}
              <br />
              <span className={ui.badge} data-state={job.status}>
                {notificationStatuses[job.status]}
              </span>
            </summary>
            <p>
              Programado: {rdDate(job.scheduled_at)} ·{" "}
              {rdTime(job.scheduled_at)}
            </p>
            <p>Intentos de envío: {job.attempts}</p>
            {job.sent_at && (
              <p>
                Aceptado por el proveedor: {rdDate(job.sent_at)},{" "}
                {rdTime(job.sent_at)}
              </p>
            )}
            {job.delivered_at && (
              <p>
                Entrega confirmada: {rdDate(job.delivered_at)},{" "}
                {rdTime(job.delivered_at)}
              </p>
            )}
            {job.status === "uncertain" && (
              <p className={ui.notice}>
                El proveedor pudo aceptar el mensaje antes de la interrupción.
                Revisa su consola o espera el webhook. El sistema no lo
                reenviará automáticamente.
              </p>
            )}
            {job.last_error && (
              <p>
                Diagnóstico: <code>{job.last_error}</code>
              </p>
            )}
            {job.provider_id && (
              <p>
                ID del proveedor: <code>{job.provider_id}</code>
              </p>
            )}
            <ul className={ui.timeline}>
              {data.notificationAttempts
                ?.filter((a) => a.job_id === job.id)
                .map((a) => (
                  <li key={a.id}>
                    {rdDate(a.started_at)} · {rdTime(a.started_at)} —{" "}
                    {notificationStatuses[
                      a.outcome as keyof typeof notificationStatuses
                    ] || a.outcome}
                    {a.error_code && <small> · {a.error_code}</small>}
                  </li>
                ))}
            </ul>
            <ul className={ui.timeline}>
              {data.notificationEvents
                ?.filter((e) => e.job_id === job.id)
                .map((e) => (
                  <li key={e.id}>
                    {rdDate(e.occurred_at)} · {rdTime(e.occurred_at)} — Webhook{" "}
                    {notificationStatuses[
                      e.status as keyof typeof notificationStatuses
                    ] || e.status}
                  </li>
                ))}
            </ul>
            <div className={ui.actions}>
              <button
                type="button"
                className={ui.secondary}
                disabled={busy}
                onClick={() => onOpen(job.appointment_id)}
              >
                Abrir cita
              </button>
              {!scope && (
                <button
                  type="button"
                  className={ui.secondary}
                  disabled={busy}
                  onClick={() => void inspect(job.appointment_id)}
                >
                  Ver historial de esta cita
                </button>
              )}
            </div>
          </details>
        ))}
      {loading && <p role="status">Consultando avisos…</p>}
      {!loading && !(data.notifications || []).length && (
        <p className={styles.empty}>No hay avisos registrados.</p>
      )}
    </section>
  );
}
