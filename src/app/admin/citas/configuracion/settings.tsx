"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAgendaClock } from "@/components/appointments/use-clock";
import { useState } from "react";
import { agendaGet, agendaPost } from "@/components/appointments/admin-api";
import {
  appointmentKinds,
  rdDate,
  rdTime,
  weekdays,
  type AgendaSettings,
  type AgendaWorkspace,
} from "@/lib/appointments/types";
import { NotificationCenter } from "../notifications";
import styles from "@/components/appointments/admin.module.css";
import ui from "@/components/appointments/agenda.module.css";
const editable: (keyof AgendaSettings)[] = [
  "enabled",
  "durations",
  "buffer_minutes",
  "hold_hours",
  "minimum_notice_minutes",
  "booking_horizon_days",
  "max_daily_appointments",
  "modalities",
  "meeting_locations",
  "cancellation_minutes",
  "reminder_24h",
  "reminder_day",
  "reminder_time",
  "owner_whatsapp_opt_in",
  "retention_days",
];
export function AgendaConfiguration({
  initial,
  readOnly,
}: {
  initial: AgendaWorkspace;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial),
    [draft, setDraft] = useState(initial.settings),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [ruleMode, setRuleMode] = useState("weekly"),
    [blockMode, setBlockMode] = useState("fixed");
  const now = useAgendaClock();
  const disabled = busy || readOnly;
  const mutate = async (
    operation: string,
    payload: Record<string, unknown>,
    settings = false,
  ) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await agendaPost<{ revision: number }>({
        action: "configure",
        operation,
        data: payload,
        expected: settings ? draft.revision : data.settings.revision,
      });
      const latest = await agendaGet<AgendaWorkspace>("kind=settings");
      setData(latest);
      if (settings) setDraft(latest.settings);
      else
        setDraft((previous) =>
          previous.revision === data.settings.revision
            ? { ...previous, revision: result.revision }
            : previous,
        );
      setNotice(
        "Configuración guardada. Las citas existentes conservan sus horarios.",
      );
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo guardar. Tus cambios siguen en el formulario.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };
  const field = <K extends keyof AgendaSettings>(
    key: K,
    value: AgendaSettings[K],
  ) => setDraft((d) => ({ ...d, [key]: value }));
  const ownerPermission = async (
    userId: string,
    revoke: boolean,
    permissions: Record<string, boolean>,
  ) => {
    setBusy(true);
    setError("");
    try {
      await agendaPost({ action: "grant", userId, revoke, permissions });
      setData(await agendaGet<AgendaWorkspace>("kind=settings"));
      setNotice(
        revoke
          ? "Autorización técnica revocada."
          : "Autorización técnica registrada por UID verificado.",
      );
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cambiar el acceso.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };
  const schedulerHealthy =
    now > 0 &&
    !!data.runtime.lastWorkerAt &&
    now - Date.parse(data.runtime.lastWorkerAt) < 5 * 60000;
  return (
    <main id="contenido" className={styles.main}>
      <div className={styles.top}>
        <div>
          <p className={ui.eyebrow}>
            Control de tu tiempo · República Dominicana
          </p>
          <h1>Horarios y configuración</h1>
          <p>
            Define tu disponibilidad real. No se añaden clases, compromisos ni
            horarios universitarios automáticamente.
          </p>
        </div>
        <Link className={ui.secondary} href="/admin/citas">
          Volver a citas
        </Link>
      </div>
      {readOnly && (
        <p className={ui.notice}>
          Preview de lectura: los cambios de agenda y envíos reales están
          desactivados.
        </p>
      )}
      {error && (
        <p role="alert" className={`${ui.notice} ${ui.error}`}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className={`${ui.notice} ${ui.success}`}>
          {notice}
        </p>
      )}
      <section className={ui.panel}>
        <h2>Estado operativo</h2>
        <div className={styles.twoColumns}>
          <div className={styles.integration}>
            <strong>Reservas públicas</strong>
            <p>
              {data.settings.enabled
                ? "Habilitadas en la configuración; requieren propietario, disponibilidad, CAPTCHA, firma segura y procesador saludable."
                : "Cerradas. No se reciben solicitudes desde el calendario."}
            </p>
            <Link
              href="/citas"
              className={ui.secondary}
              target="_blank"
              rel="noopener noreferrer"
            >
              Revisar página de reservas
            </Link>
          </div>
          <div className={styles.integration}>
            <strong>Procesador automático</strong>
            <span className={ui.badge}>
              {schedulerHealthy ? "Ejecución reciente" : "Requiere atención"}
            </span>
            <p>
              {data.runtime.lastWorkerAt
                ? `Última ejecución recibida: ${rdDate(data.runtime.lastWorkerAt)}, ${rdTime(data.runtime.lastWorkerAt)}. Puede ser manual o de Cron.`
                : "Todavía no se recibió una ejecución del procesador."}
            </p>
            <p>
              {data.runtime.schedulerEnabledAt
                ? "La programación está registrada. Comprueba su continuidad en Supabase Cron."
                : "Falta instalar la programación de Supabase Cron."}
            </p>
            <p className={ui.muted}>
              Si el procesador deja de responder durante cinco minutos, las
              nuevas reservas se cierran hasta recuperar el servicio.
            </p>
          </div>
        </div>
      </section>
      <div className={styles.twoColumns} style={{ marginTop: 24 }}>
        <section className={ui.panel}>
          <h2>Reglas de reserva</h2>
          <form
            className={ui.stack}
            onSubmit={(e) => {
              e.preventDefault();
              const payload = Object.fromEntries(
                editable.map((key) => [key, draft[key]]),
              );
              payload.meeting_locations = draft.meeting_locations
                .map((s) => s.trim())
                .filter(Boolean);
              void mutate("settings", payload, true);
            }}
          >
            <label className={ui.check}>
              <input
                type="checkbox"
                checked={draft.enabled}
                disabled={disabled}
                onChange={(e) => field("enabled", e.target.checked)}
              />
              <span>
                Recibir solicitudes desde la web cuando estén listos los
                requisitos operativos.
              </span>
            </label>
            <h3>Duración por tipo de cita</h3>
            <div className={ui.formGrid}>
              {Object.entries(appointmentKinds).map(([kind, label]) => (
                <label className={ui.field} key={kind}>
                  {label} (minutos)
                  <input
                    type="number"
                    min={30}
                    max={480}
                    step={15}
                    required
                    value={
                      draft.durations[kind as keyof typeof appointmentKinds]
                    }
                    disabled={disabled}
                    onChange={(e) =>
                      field("durations", {
                        ...draft.durations,
                        [kind]: Number(e.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <p className={ui.muted}>
              60, 90 y 120 minutos, o una duración autorizada de 30 a 480
              minutos en intervalos de 15. Las citas ya solicitadas conservan su
              duración original.
            </p>
            <div className={ui.formGrid}>
              <label className={ui.field}>
                Margen posterior
                <select
                  value={draft.buffer_minutes}
                  disabled={disabled}
                  onChange={(e) =>
                    field("buffer_minutes", Number(e.target.value))
                  }
                >
                  {[0, 15, 30, 45, 60].map((n) => (
                    <option key={n} value={n}>
                      {n} minutos
                    </option>
                  ))}
                </select>
              </label>
              <label className={ui.field}>
                Máximo de citas diarias
                <input
                  type="number"
                  min={1}
                  max={24}
                  required
                  value={draft.max_daily_appointments}
                  disabled={disabled}
                  onChange={(e) =>
                    field("max_daily_appointments", Number(e.target.value))
                  }
                />
              </label>
              <label className={ui.field}>
                Anticipación mínima (minutos)
                <input
                  type="number"
                  min={30}
                  max={10080}
                  required
                  value={draft.minimum_notice_minutes}
                  disabled={disabled}
                  onChange={(e) =>
                    field("minimum_notice_minutes", Number(e.target.value))
                  }
                />
              </label>
              <label className={ui.field}>
                Hasta cuántos días reservar
                <input
                  type="number"
                  min={1}
                  max={90}
                  required
                  value={draft.booking_horizon_days}
                  disabled={disabled}
                  onChange={(e) =>
                    field("booking_horizon_days", Number(e.target.value))
                  }
                />
              </label>
              <label className={ui.field}>
                Vigencia provisional (horas)
                <input
                  type="number"
                  min={1}
                  max={48}
                  required
                  value={draft.hold_hours}
                  disabled={disabled}
                  onChange={(e) => field("hold_hours", Number(e.target.value))}
                />
              </label>
              <label className={ui.field}>
                Anticipación para cancelar (minutos)
                <input
                  type="number"
                  min={0}
                  max={10080}
                  required
                  value={draft.cancellation_minutes}
                  disabled={disabled}
                  onChange={(e) =>
                    field("cancellation_minutes", Number(e.target.value))
                  }
                />
              </label>
            </div>
            <h3>Modalidades habilitadas</h3>
            {(["presencial", "virtual"] as const).map((m) => (
              <label className={ui.check} key={m}>
                <input
                  type="checkbox"
                  checked={draft.modalities.includes(m)}
                  disabled={disabled}
                  onChange={(e) =>
                    field(
                      "modalities",
                      e.target.checked
                        ? [...draft.modalities, m]
                        : draft.modalities.filter((v) => v !== m),
                    )
                  }
                />
                <span>
                  {m === "virtual" ? "Reunión virtual" : "Cita presencial"}
                </span>
              </label>
            ))}
            <label className={ui.field}>
              Lugares autorizados (uno por línea)
              <textarea
                value={draft.meeting_locations.join("\n")}
                maxLength={2900}
                disabled={disabled}
                onChange={(e) =>
                  field("meeting_locations", e.target.value.split("\n"))
                }
              />
              <small>
                Solo lugares reales. Las instrucciones definitivas se confirman
                en cada cita.
              </small>
            </label>
            <h3>Recordatorios</h3>
            <label className={ui.check}>
              <input
                type="checkbox"
                checked={draft.reminder_24h}
                disabled={disabled}
                onChange={(e) => field("reminder_24h", e.target.checked)}
              />
              <span>
                24 horas antes, solo si la confirmación llega antes de ese
                momento.
              </span>
            </label>
            <label className={ui.check}>
              <input
                type="checkbox"
                checked={draft.reminder_day}
                disabled={disabled}
                onChange={(e) => field("reminder_day", e.target.checked)}
              />
              <span>
                El día de la cita. Para citas tempranas se adelanta hasta una
                hora antes del inicio.
              </span>
            </label>
            <label className={ui.field}>
              Hora del recordatorio diario (RD)
              <input
                type="time"
                required
                value={draft.reminder_time.slice(0, 5)}
                disabled={disabled}
                onChange={(e) => field("reminder_time", e.target.value)}
              />
            </label>
            <label className={ui.check}>
              <input
                type="checkbox"
                checked={draft.owner_whatsapp_opt_in}
                disabled={disabled}
                onChange={(e) =>
                  field("owner_whatsapp_opt_in", e.target.checked)
                }
              />
              <span>
                Confirmo la autorización de Thony para recibir avisos operativos
                de citas en +1 829-404-5770. El envío requiere un remitente
                oficial y plantillas aprobadas.
              </span>
            </label>
            <label className={ui.field}>
              Conservación sin interacción (días)
              <input
                type="number"
                min={30}
                max={1825}
                required
                value={draft.retention_days}
                disabled={disabled}
                onChange={(e) =>
                  field("retention_days", Number(e.target.value))
                }
              />
              <small>
                El procesador suprime contactos y notas vencidos cuando no haya
                citas activas; conserva el historial mínimo de estados.
              </small>
            </label>
            <div className={ui.actions}>
              <button type="submit" className={ui.primary} disabled={disabled}>
                {busy ? "Guardando…" : "Guardar reglas de reserva"}
              </button>
              <button
                type="button"
                className={ui.secondary}
                disabled={busy}
                onClick={async () => {
                  if (
                    !window.confirm(
                      "Recargar reemplazará los cambios sin guardar de este formulario. ¿Continuar?",
                    )
                  )
                    return;
                  try {
                    const latest =
                      await agendaGet<AgendaWorkspace>("kind=settings");
                    setData(latest);
                    setDraft(latest.settings);
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "No se pudo recargar.",
                    );
                  }
                }}
              >
                Recargar configuración
              </button>
            </div>
          </form>
        </section>
        <div className={ui.stack}>
          <section className={ui.panel}>
            <h2>Días y horas de atención</h2>
            <p className={ui.muted}>
              Los inicios se ofrecen cada 30 minutos cuando la cita completa y
              su margen caben en una jornada.
            </p>
            {data.rules.length ? (
              data.rules.map((r) => (
                <div className={styles.rule} key={r.id}>
                  <span>
                    {r.on_date
                      ? rdDate(r.on_date + "T12:00:00-04:00")
                      : weekdays[r.weekday!]}
                    <br />
                    {r.starts_at.slice(0, 5)} – {r.ends_at.slice(0, 5)} ·{" "}
                    {r.enabled ? "Disponible" : "Desactivada"}
                  </span>
                  <button
                    type="button"
                    className={ui.secondary}
                    disabled={disabled}
                    onClick={() => void mutate("rule_remove", { id: r.id })}
                  >
                    Retirar horario
                  </button>
                </div>
              ))
            ) : (
              <p className={styles.empty}>
                Todavía no hay horarios. Introduce los que Thony haya
                autorizado.
              </p>
            )}
            <form
              className={ui.stack}
              style={{ marginTop: 22 }}
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget,
                  f = new FormData(form);
                const result = await mutate("rule_save", {
                  weekday:
                    ruleMode === "weekly" ? Number(f.get("weekday")) : null,
                  on_date: ruleMode === "date" ? f.get("on_date") : null,
                  starts_at: f.get("starts_at"),
                  ends_at: f.get("ends_at"),
                  enabled: true,
                });
                if (result) form.reset();
              }}
            >
              <label className={ui.field}>
                Frecuencia
                <select
                  value={ruleMode}
                  disabled={disabled}
                  onChange={(e) => setRuleMode(e.target.value)}
                >
                  <option value="weekly">Cada semana</option>
                  <option value="date">Fecha extraordinaria</option>
                </select>
              </label>
              {ruleMode === "weekly" ? (
                <label className={ui.field}>
                  Día laborable
                  <select
                    name="weekday"
                    required
                    disabled={disabled}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecciona un día
                    </option>
                    {weekdays.map((label, n) => (
                      <option value={n} key={n}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className={ui.field}>
                  Fecha extraordinaria
                  <input
                    type="date"
                    name="on_date"
                    required
                    disabled={disabled}
                  />
                </label>
              )}
              <div className={ui.formGrid}>
                <label className={ui.field}>
                  Inicio (RD)
                  <input
                    type="time"
                    name="starts_at"
                    required
                    disabled={disabled}
                  />
                </label>
                <label className={ui.field}>
                  Cierre (RD)
                  <input
                    type="time"
                    name="ends_at"
                    required
                    disabled={disabled}
                  />
                </label>
              </div>
              <button type="submit" className={ui.primary} disabled={disabled}>
                Añadir disponibilidad
              </button>
            </form>
          </section>
          <section className={ui.panel}>
            <h2>Bloqueos personales</h2>
            <p className={ui.muted}>
              Clases, estudio, exámenes, ausencias o vacaciones. El visitante
              solo verá «No disponible».
            </p>
            {data.blackouts.map((b) => (
              <div className={styles.rule} key={b.id}>
                <span>
                  {b.label}
                  <br />
                  {b.starts_at
                    ? `${rdDate(b.starts_at)} ${rdTime(b.starts_at)} — ${rdDate(b.ends_at!)} ${rdTime(b.ends_at!)}`
                    : `${weekdays[b.weekday!]} · ${b.start_time?.slice(0, 5)} – ${b.end_time?.slice(0, 5)}`}
                  <br />
                  {b.valid_from && `${b.valid_from} a ${b.valid_until}`}
                </span>
                <button
                  type="button"
                  className={ui.secondary}
                  disabled={disabled}
                  onClick={() => void mutate("blackout_remove", { id: b.id })}
                >
                  Retirar bloqueo
                </button>
              </div>
            ))}
            {!data.blackouts.length && (
              <p className={styles.empty}>Sin bloqueos registrados.</p>
            )}
            <form
              className={ui.stack}
              style={{ marginTop: 20 }}
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget,
                  f = new FormData(form),
                  fixed = blockMode === "fixed";
                const local = (name: string) =>
                  String(f.get(name)) + ":00-04:00";
                const result = await mutate("blackout_save", {
                  label: f.get("label"),
                  enabled: true,
                  ...(fixed
                    ? {
                        starts_at: local("starts_at"),
                        ends_at: local("ends_at"),
                      }
                    : {
                        weekday: Number(f.get("weekday")),
                        start_time: f.get("start_time"),
                        end_time: f.get("end_time"),
                        valid_from: f.get("valid_from"),
                        valid_until: f.get("valid_until"),
                      }),
                });
                if (result) form.reset();
              }}
            >
              <label className={ui.field}>
                Motivo privado
                <input
                  name="label"
                  required
                  maxLength={160}
                  disabled={disabled}
                />
              </label>
              <label className={ui.field}>
                Tipo de bloqueo
                <select
                  value={blockMode}
                  disabled={disabled}
                  onChange={(e) => setBlockMode(e.target.value)}
                >
                  <option value="fixed">Rango de fechas y horas</option>
                  <option value="weekly">Recurrente semanal</option>
                </select>
              </label>
              {blockMode === "fixed" ? (
                <>
                  <label className={ui.field}>
                    Inicio del bloqueo (RD)
                    <input
                      name="starts_at"
                      type="datetime-local"
                      required
                      disabled={disabled}
                    />
                  </label>
                  <label className={ui.field}>
                    Final del bloqueo (RD)
                    <input
                      name="ends_at"
                      type="datetime-local"
                      required
                      disabled={disabled}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className={ui.field}>
                    Día semanal
                    <select
                      name="weekday"
                      required
                      disabled={disabled}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Selecciona un día
                      </option>
                      {weekdays.map((label, n) => (
                        <option key={n} value={n}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={ui.formGrid}>
                    <label className={ui.field}>
                      Hora inicial (RD)
                      <input
                        type="time"
                        name="start_time"
                        required
                        disabled={disabled}
                      />
                    </label>
                    <label className={ui.field}>
                      Hora final (RD)
                      <input
                        type="time"
                        name="end_time"
                        required
                        disabled={disabled}
                      />
                    </label>
                    <label className={ui.field}>
                      Desde
                      <input
                        type="date"
                        name="valid_from"
                        required
                        disabled={disabled}
                      />
                    </label>
                    <label className={ui.field}>
                      Hasta
                      <input
                        type="date"
                        name="valid_until"
                        required
                        disabled={disabled}
                      />
                    </label>
                  </div>
                </>
              )}
              <button type="submit" className={ui.primary} disabled={disabled}>
                Guardar bloqueo privado
              </button>
            </form>
          </section>
        </div>
      </div>
      {data.access.permissions && (
        <section className={ui.panel} style={{ marginTop: 24 }}>
          <h2>Autorizaciones técnicas de esta agenda</h2>
          <p className={ui.muted}>
            Los administradores y asesores de Ramaldi no heredan acceso. Solo se
            admiten UID verificados con SUPERADMIN previo. El propietario de
            Thony se vincula mediante el procedimiento SQL revisado.
          </p>
          {data.grants?.map((g) => (
            <div className={styles.rule} key={g.user_id}>
              <span>
                {g.kind === "owner"
                  ? "Thony · propietario"
                  : "Técnico autorizado"}
                <br />
                <code>{g.user_id}</code>
                <br />
                {g.revoked_at ? "Acceso revocado" : "Autorización vigente"}
              </span>
              {g.kind !== "owner" && !g.revoked_at && (
                <button
                  type="button"
                  className={ui.danger}
                  disabled={disabled}
                  onClick={() => void ownerPermission(g.user_id, true, {})}
                >
                  Revocar acceso técnico
                </button>
              )}
            </div>
          ))}
          <form
            className={ui.stack}
            style={{ marginTop: 22 }}
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget,
                f = new FormData(form);
              const ok = await ownerPermission(String(f.get("userId")), false, {
                manage: true,
                leads: f.get("leads") === "on",
                export: f.get("export") === "on",
                permissions: f.get("permissions") === "on",
                notifications: f.get("notifications") === "on",
              });
              if (ok) form.reset();
            }}
          >
            <label className={ui.field}>
              UID del superadministrador verificado
              <input
                name="userId"
                required
                minLength={36}
                maxLength={36}
                disabled={disabled}
              />
            </label>
            <p className={ui.muted}>
              Este permiso autoriza la agenda y los datos de contacto de sus
              citas. El CRM completo y la exportación se conceden por separado.
            </p>
            {[
              ["leads", "Consultar y gestionar el CRM privado"],
              ["export", "Exportar clientes (requiere también CRM)"],
              ["notifications", "Revisar notificaciones y errores"],
              ["permissions", "Administrar autorizaciones de este módulo"],
            ].map(([name, label]) => (
              <label className={ui.check} key={name}>
                <input type="checkbox" name={name} disabled={disabled} />
                <span>{label}</span>
              </label>
            ))}
            <button type="submit" className={ui.primary} disabled={disabled}>
              Autorizar técnico por UID
            </button>
          </form>
        </section>
      )}
      {data.access.notifications && (
        <NotificationCenter
          initial={data}
          readOnly={readOnly}
          onOpen={(id) => {
            router.push("/admin/citas?solicitud=" + id);
          }}
          onProcessed={() => {
            void agendaGet<AgendaWorkspace>("kind=settings")
              .then(setData)
              .catch((e) => setError(e.message));
          }}
        />
      )}
    </main>
  );
}
