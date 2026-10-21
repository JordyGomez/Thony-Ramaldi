"use client";
import { useCallback, useEffect, useState } from "react";
import {
  appointmentKinds,
  appointmentStatuses,
  rdDate,
  rdTime,
  type CustomerAppointment,
  type Slot,
} from "@/lib/appointments/types";
import { AppointmentDatePicker } from "./date-picker";
import styles from "./agenda.module.css";
export function CustomerPortal() {
  const [appointment, setAppointment] = useState<CustomerAppointment | null>(
      null,
    ),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [showReschedule, setShowReschedule] = useState(false),
    [day, setDay] = useState(""),
    [slot, setSlot] = useState<Slot | null>(null),
    [confirmCancel, setConfirmCancel] = useState(false);
  const read = useCallback(async () => {
    const fragment = window.location.hash.slice(1);
    if (fragment) {
      const response = await fetch("/api/citas/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: fragment }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      history.replaceState(null, "", location.pathname);
    }
    const response = await fetch("/api/citas/gestion", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result.appointment as CustomerAppointment;
  }, []);
  const load = () => {
    setLoading(true);
    setError("");
    void read()
      .then(setAppointment)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    let active = true;
    read()
      .then((value) => {
        if (active) setAppointment(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [read]);
  const act = async (
    action: string,
    preferences?: { whatsappConsent: boolean; communicationPreference: string },
  ) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/citas/gestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...preferences,
          ...(action === "propose" ? { startsAt: slot?.startsAt } : {}),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setAppointment(data.appointment);
      setConfirmCancel(false);
      setShowReschedule(false);
      setNotice(
        action === "propose"
          ? "Propuesta enviada. Thony debe aceptarla; tu cita anterior se conserva."
          : "El estado de tu solicitud fue actualizado.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos completar la operación.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={styles.stack}>
      {error && (
        <p role="alert" className={`${styles.notice} ${styles.error}`}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className={`${styles.notice} ${styles.success}`}>
          {notice}
        </p>
      )}
      {loading && <p role="status">Consultando tu solicitud…</p>}
      {!loading && !appointment && (
        <div className={styles.panel}>
          <h2>Necesitas tu enlace personal</h2>
          <p className={styles.muted}>
            Abre el enlace recibido al solicitar la cita o en un aviso de Thony.
            No puedes consultar solicitudes mediante un identificador público.
          </p>
          <a
            href="mailto:brokerthonypaulino@ramaldigroup.com"
            className={styles.secondary}
          >
            Contactar a Thony
          </a>
        </div>
      )}
      {appointment && (
        <>
          <section className={styles.panel} aria-busy={busy}>
            <span className={styles.badge} data-state={appointment.status}>
              {appointmentStatuses[appointment.status]}
            </span>
            <h2>{appointmentKinds[appointment.kind]}</h2>
            <dl className={styles.summary}>
              {[
                ["Nombre", appointment.name],
                ["Fecha", rdDate(appointment.startsAt)],
                [
                  "Hora",
                  rdTime(appointment.startsAt) + " · República Dominicana",
                ],
                [
                  "Duración",
                  Math.round(
                    (Date.parse(appointment.endsAt) -
                      Date.parse(appointment.startsAt)) /
                      60000,
                  ) + " minutos",
                ],
                [
                  "Modalidad",
                  appointment.modality === "virtual" ? "Virtual" : "Presencial",
                ],
                [
                  "Propiedad",
                  appointment.property
                    ? appointment.property.reference +
                      " · " +
                      appointment.property.title
                    : "Consulta general",
                ],
                ["Contacto", appointment.email + " · " + appointment.phone],
                ...(appointment.instructions
                  ? [["Instrucciones confirmadas", appointment.instructions]]
                  : []),
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {appointment.status === "pending" && (
              <p className={styles.notice}>
                Thony aún debe confirmar tu solicitud. La reserva provisional
                vence el {rdDate(appointment.expiresAt)}, a las{" "}
                {rdTime(appointment.expiresAt)}.
              </p>
            )}
            {appointment.proposal && (
              <div className={styles.notice}>
                <h3>Propuesta de horario</h3>
                <p>
                  {rdDate(appointment.proposal.startsAt)} ·{" "}
                  {rdTime(appointment.proposal.startsAt)}
                </p>
                <p>
                  Vigente hasta {rdDate(appointment.proposal.expiresAt)},{" "}
                  {rdTime(appointment.proposal.expiresAt)}.{" "}
                  {appointment.baseStatus === "confirmed"
                    ? "Tu horario confirmado anterior se conserva hasta que se acepte el cambio."
                    : ""}
                </p>
                <div className={styles.actions}>
                  {appointment.proposal.initiatedBy === "thony" ? (
                    <>
                      <button
                        type="button"
                        className={styles.primary}
                        disabled={busy}
                        onClick={() => void act("accept_proposal")}
                      >
                        Aceptar nuevo horario
                      </button>
                      <button
                        type="button"
                        className={styles.secondary}
                        disabled={busy}
                        onClick={() => void act("decline_proposal")}
                      >
                        Rechazar propuesta
                      </button>
                    </>
                  ) : (
                    <>
                      <p>
                        Tu propuesta está pendiente de la aceptación de Thony.
                      </p>
                      <button
                        type="button"
                        className={styles.secondary}
                        disabled={busy}
                        onClick={() => void act("decline_proposal")}
                      >
                        Retirar mi propuesta
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                disabled={busy || loading}
                onClick={load}
              >
                Actualizar estado
              </button>
              {(appointment.status === "confirmed" ||
                appointment.baseStatus === "confirmed") && (
                <a className={styles.secondary} href="/api/citas/calendario">
                  Añadir al calendario (.ics)
                </a>
              )}
              {appointment.status === "confirmed" && (
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={busy}
                  onClick={() => setShowReschedule(!showReschedule)}
                >
                  Solicitar reprogramación
                </button>
              )}
              {[
                "pending",
                "confirmed",
                "change_proposed",
                "reschedule_requested",
              ].includes(appointment.status) && (
                <button
                  type="button"
                  className={styles.danger}
                  disabled={busy}
                  onClick={() => setConfirmCancel(!confirmCancel)}
                >
                  Cancelar solicitud
                </button>
              )}
            </div>
            {confirmCancel && (
              <div className={styles.notice}>
                <p>
                  ¿Deseas cancelar esta solicitud? El horario quedará liberado.
                  Esta acción no se puede deshacer.
                </p>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.danger}
                    disabled={busy}
                    onClick={() => void act("cancel")}
                  >
                    Confirmar cancelación
                  </button>
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={busy}
                    onClick={() => setConfirmCancel(false)}
                  >
                    Conservar solicitud
                  </button>
                </div>
              </div>
            )}
            {showReschedule && (
              <div style={{ marginTop: 28 }}>
                <h3>Propón una nueva fecha</h3>
                <AppointmentDatePicker
                  source="/api/citas/gestion?kind=availability"
                  day={day}
                  onDay={(value) => {
                    setDay(value);
                    setSlot(null);
                  }}
                  slot={slot?.startsAt || ""}
                  onSlot={setSlot}
                />
                <button
                  type="button"
                  className={styles.primary}
                  disabled={busy || !slot}
                  onClick={() => void act("propose")}
                >
                  Enviar propuesta a Thony
                </button>
              </div>
            )}
          </section>
          <section className={styles.panel}>
            <h2>Canales de comunicación</h2>
            <p className={styles.muted}>
              Puedes retirar la autorización de WhatsApp sin cancelar tu cita.
              No autorizas publicidad.
            </p>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={appointment.whatsappConsent}
                disabled={busy}
                onChange={(e) =>
                  void act("preferences", {
                    whatsappConsent: e.target.checked,
                    communicationPreference: e.target.checked
                      ? "both"
                      : "email",
                  })
                }
              />
              <span>Recibir avisos operativos por WhatsApp</span>
            </label>
          </section>
          <section className={styles.panel}>
            <h2>Historial de tu solicitud</h2>
            <ol className={styles.timeline}>
              {appointment.history.map((h, index) => (
                <li key={index}>
                  <time dateTime={h.createdAt}>
                    {rdDate(h.createdAt)} · {rdTime(h.createdAt)}
                  </time>
                  {h.status && h.status in appointmentStatuses
                    ? appointmentStatuses[
                        h.status as keyof typeof appointmentStatuses
                      ]
                    : h.event === "proposal_expired"
                      ? "La propuesta venció"
                      : h.event === "proposal_declined"
                        ? "La propuesta no fue aceptada"
                        : "Actualización de la solicitud"}
                </li>
              ))}
            </ol>
            <p className={styles.muted}>
              Tu enlace es personal. Para corregir datos o solicitar su
              eliminación:{" "}
              <a href="mailto:brokerthonypaulino@ramaldigroup.com">
                brokerthonypaulino@ramaldigroup.com
              </a>
              .
            </p>
          </section>
        </>
      )}
    </div>
  );
}
