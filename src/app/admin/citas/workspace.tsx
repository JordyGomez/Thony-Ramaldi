"use client";
import Link from "next/link";
import { useAgendaClock } from "@/components/appointments/use-clock";
import { useCallback, useEffect, useState } from "react";
import { agendaGet, agendaPost } from "@/components/appointments/admin-api";
import { AppointmentDatePicker } from "@/components/appointments/date-picker";
import {
  appointmentKinds,
  appointmentStatuses,
  rdDate,
  rdDay,
  rdTime,
  weekdays,
  type AgendaWorkspace,
  type AppointmentRow,
  type Slot,
} from "@/lib/appointments/types";
import { NotificationCenter } from "./notifications";
import styles from "@/components/appointments/admin.module.css";
import ui from "@/components/appointments/agenda.module.css";
type CalendarRow = Pick<
  AppointmentRow,
  | "id"
  | "starts_at"
  | "ends_at"
  | "status"
  | "modality"
  | "kind"
  | "proposals"
  | "buffer_minutes"
> & { client: { name: string } };
type CalendarEntry = {
  key: string;
  appointment: CalendarRow;
  start: string;
  end: string;
  proposal: boolean;
};
function addDays(date: string, n: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function weekStart(date: string) {
  const d = new Date(date + "T12:00:00Z");
  return addDays(date, -((d.getUTCDay() + 6) % 7));
}
function monthStart(date: string) {
  return date.slice(0, 7) + "-01";
}
function historyLabel(event: string) {
  return (
    (
      {
        requested: "Solicitud recibida",
        confirm: "Cita confirmada",
        reject: "Solicitud rechazada",
        cancel: "Cancelación de Thony",
        cancelled_client: "Cancelación del cliente",
        expired: "Reserva provisional vencida",
        proposal_created: "Nuevo horario propuesto",
        proposal_expired: "Propuesta vencida",
        proposal_declined: "Propuesta no aceptada",
        rescheduled: "Horario reprogramado",
        note: "Nota privada",
        complete: "Cita completada",
        no_show: "Cliente no asistió",
      } as Record<string, string>
    )[event] || event
  );
}
export function AppointmentWorkspace({
  initial,
  readOnly,
  initialSelection,
}: {
  initial: AgendaWorkspace;
  readOnly: boolean;
  initialSelection?: string;
}) {
  const [data, setData] = useState(initial),
    [view, setView] = useState<"day" | "week" | "month" | "list">("week"),
    [date, setDate] = useState(rdDay()),
    [calendarResult, setCalendarResult] = useState<{
      key: string;
      rows: CalendarRow[];
    }>({ key: "", rows: [] }),
    [selected, setSelected] = useState<AppointmentRow | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [refresh, setRefresh] = useState(0),
    [status, setStatus] = useState(""),
    [freeKind, setFreeKind] = useState("general"),
    [freeResult, setFreeResult] = useState<{ key: string; slots: Slot[] }>({
      key: "",
      slots: [],
    }),
    [listPage, setListPage] = useState(0);
  const start =
    view === "day"
      ? date
      : view === "week"
        ? weekStart(date)
        : view === "month"
          ? weekStart(monthStart(date))
          : addDays(date, -30);
  const until = addDays(
    start,
    view === "day" ? 1 : view === "week" ? 7 : view === "month" ? 42 : 120,
  );
  const calendarKey = start + "|" + until + "|" + view + "|" + refresh,
    freeKey = date + "|" + freeKind + "|" + refresh;
  const calendar =
      calendarResult.key === calendarKey ? calendarResult.rows : [],
    calendarLoading = calendarResult.key !== calendarKey,
    free = freeResult.key === freeKey ? freeResult.slots : [],
    freeLoading = freeResult.key !== freeKey;
  const select = useCallback(async (id: string) => {
    try {
      const result = await agendaGet<{ appointment: AppointmentRow }>(
        "kind=appointment&id=" + id,
      );
      setError("");
      setSelected(result.appointment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos abrir la cita.");
    }
  }, []);
  useEffect(() => {
    if (!initialSelection) return;
    const c = new AbortController();
    agendaGet<{ appointment: AppointmentRow }>(
      "kind=appointment&id=" + initialSelection,
      c.signal,
    )
      .then((result) => setSelected(result.appointment))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [initialSelection]);
  useEffect(() => {
    if (view === "list") return;
    const c = new AbortController();
    agendaGet<{ appointments: CalendarRow[] }>(
      `kind=calendar&from=${encodeURIComponent(start + "T00:00:00-04:00")}&until=${encodeURIComponent(until + "T00:00:00-04:00")}`,
      c.signal,
    )
      .then((d) => {
        setError("");
        setCalendarResult({ key: calendarKey, rows: d.appointments });
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e.message);
          setCalendarResult({ key: calendarKey, rows: [] });
        }
      });
    return () => c.abort();
  }, [start, until, refresh, view, calendarKey]);
  useEffect(() => {
    const c = new AbortController();
    agendaGet<{ slots: Slot[] }>(
      `kind=availability&day=${date}&type=${freeKind}&modality=${data.settings.modalities[0] || "presencial"}`,
      c.signal,
    )
      .then((d) => setFreeResult({ key: freeKey, slots: d.slots }))
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e.message);
          setFreeResult({ key: freeKey, slots: [] });
        }
      });
    return () => c.abort();
  }, [date, freeKind, refresh, data.settings.modalities, freeKey]);
  useEffect(() => {
    if (view !== "list") return;
    const c = new AbortController();
    agendaGet<AgendaWorkspace>(
      `kind=appointments&from=${encodeURIComponent(start + "T00:00:00-04:00")}&until=${encodeURIComponent(until + "T00:00:00-04:00")}`,
      c.signal,
    )
      .then((d) => {
        setData(d);
        setListPage(0);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [view, start, until]);
  const reload = async () => {
    const latest = await agendaGet<AgendaWorkspace>(
      "kind=appointments" +
        (view === "list"
          ? "&page=" +
            listPage +
            "&from=" +
            encodeURIComponent(start + "T00:00:00-04:00") +
            "&until=" +
            encodeURIComponent(until + "T00:00:00-04:00")
          : ""),
    );
    setData(latest);
    setRefresh((v) => v + 1);
    if (selected) await select(selected.id);
  };
  const perform = async (input: Record<string, unknown>, message: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await agendaPost(input);
      await reload();
      setNotice(message);
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos completar la operación.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };
  const entries = calendar.flatMap((a) => [
    {
      key: a.id,
      appointment: a,
      start: a.starts_at,
      end: a.ends_at,
      proposal: false,
    },
    ...a.proposals
      .filter((p) => p.status === "pending")
      .map((p) => ({
        key: p.id,
        appointment: a,
        start: p.starts_at,
        end: p.ends_at,
        proposal: true,
      })),
  ]);
  const onDay = (d: string) => entries.filter((e) => rdDay(e.start) === d);
  const visibleList = data.appointments.filter(
    (a) => !status || a.status === status,
  );
  const blackoutsOn = (day: string) =>
    data.blackouts.filter(
      (b) =>
        b.enabled &&
        (b.starts_at
          ? Date.parse(b.starts_at) <
              Date.parse(addDays(day, 1) + "T00:00:00-04:00") &&
            Date.parse(b.ends_at!) > Date.parse(day + "T00:00:00-04:00")
          : b.weekday === new Date(day + "T12:00:00Z").getUTCDay() &&
            day >= b.valid_from! &&
            day <= b.valid_until!),
    );
  const blackouts = blackoutsOn(date);
  const card = (entry: CalendarEntry) => (
    <button
      type="button"
      key={entry.key}
      className={styles.card}
      data-state={entry.proposal ? "proposal" : entry.appointment.status}
      onClick={() => void select(entry.appointment.id)}
    >
      <strong>
        {rdTime(entry.start)} – {rdTime(entry.end)}
      </strong>
      <span>{entry.appointment.client.name}</span>
      <small>
        {entry.proposal
          ? "Propuesta provisional"
          : appointmentStatuses[entry.appointment.status]}{" "}
        · {entry.appointment.modality === "virtual" ? "Virtual" : "Presencial"}
      </small>
    </button>
  );
  const metrics = [
    ["pending", "Pendientes"],
    ["today", "Citas de hoy"],
    ["tomorrow", "Citas de mañana"],
    ["confirmed", "Próximas confirmadas"],
    ["rejected", "Rechazadas"],
    ["completed", "Completadas"],
    ["cancelled", "Cancelaciones"],
    ...(data.access.leads ? [["leads", "Clientes potenciales"]] : []),
  ];
  return (
    <main id="contenido" className={styles.main}>
      <div className={styles.top}>
        <div>
          <p className={ui.eyebrow}>Agenda privada · America/Santo_Domingo</p>
          <h1>Citas de Thony</h1>
          <p>
            Solicitudes, disponibilidad y encuentros confirmados. Los
            compromisos personales y los clientes permanecen privados.
          </p>
        </div>
        <button
          className={ui.secondary}
          type="button"
          disabled={busy}
          onClick={() => void reload().catch((e) => setError(e.message))}
        >
          Actualizar agenda
        </button>
      </div>
      <nav className={styles.nav} aria-label="Herramientas de citas">
        <Link href="/admin/citas/configuracion">Horarios y configuración</Link>
        {data.access.leads && (
          <Link href="/admin/clientes-potenciales">Clientes potenciales</Link>
        )}
        <Link href="/citas" target="_blank" rel="noopener noreferrer">
          Ver reservas públicas
        </Link>
      </nav>
      {readOnly && (
        <p className={ui.notice}>
          Preview: puedes revisar la interfaz. Las reservas, cambios y envíos
          reales están desactivados en este despliegue.
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
      <section className={styles.metrics} aria-label="Resumen real de citas">
        {metrics.map(([key, label]) => (
          <div className={styles.metric} key={key}>
            <strong>{data.metrics[key] ?? 0}</strong>
            <span>{label}</span>
          </div>
        ))}
        {data.notificationMetrics && (
          <>
            <div className={styles.metric}>
              <strong>{data.notificationMetrics.pending}</strong>
              <span>Avisos pendientes o bloqueados</span>
            </div>
            <div className={styles.metric}>
              <strong>{data.notificationMetrics.errors}</strong>
              <span>Avisos que requieren atención</span>
            </div>
          </>
        )}
      </section>
      <div className={styles.work}>
        <section className={ui.panel}>
          <h2>Calendario</h2>
          <div className={styles.toolbar}>
            <div className={styles.tabs} aria-label="Vista del calendario">
              {Object.entries({
                day: "Día",
                week: "Semana",
                month: "Mes",
                list: "Lista",
              }).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={view === key}
                  onClick={() => setView(key as typeof view)}
                >
                  {label}
                </button>
              ))}
            </div>
            <label>
              Fecha
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  if (e.target.value) setDate(e.target.value);
                }}
              />
            </label>
            <button
              type="button"
              className={ui.secondary}
              onClick={() => setDate(rdDay())}
            >
              Hoy
            </button>
          </div>
          {view !== "list" && (
            <div className={styles.toolbar}>
              <button
                type="button"
                className={ui.secondary}
                onClick={() =>
                  setDate(
                    view === "month"
                      ? new Date(
                          Date.UTC(
                            Number(date.slice(0, 4)),
                            Number(date.slice(5, 7)) - 2,
                            1,
                            12,
                          ),
                        )
                          .toISOString()
                          .slice(0, 10)
                      : addDays(date, view === "day" ? -1 : -7),
                  )
                }
              >
                Anterior
              </button>
              <span>
                {view === "month"
                  ? new Intl.DateTimeFormat("es-DO", {
                      month: "long",
                      year: "numeric",
                      timeZone: "America/Santo_Domingo",
                    }).format(new Date(date + "T12:00:00Z"))
                  : rdDate(start)}
              </span>
              <button
                type="button"
                className={ui.secondary}
                onClick={() =>
                  setDate(
                    view === "month"
                      ? new Date(
                          Date.UTC(
                            Number(date.slice(0, 4)),
                            Number(date.slice(5, 7)),
                            1,
                            12,
                          ),
                        )
                          .toISOString()
                          .slice(0, 10)
                      : addDays(date, view === "day" ? 1 : 7),
                  )
                }
              >
                Siguiente
              </button>
            </div>
          )}
          {calendarLoading && view !== "list" ? (
            <p role="status">Consultando intervalos reservados…</p>
          ) : view === "month" ? (
            <div className={styles.month} aria-label="Calendario mensual">
              {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map(
                (label, index) => (
                  <div className={styles.monthHead} key={"w" + index}>
                    {label}
                  </div>
                ),
              )}
              {Array.from({ length: 42 }, (_, index) => {
                const d = addDays(start, index),
                  items = onDay(d);
                return (
                  <button
                    key={d}
                    className={styles.monthDay}
                    type="button"
                    data-outside={d.slice(0, 7) !== date.slice(0, 7)}
                    aria-pressed={d === date}
                    aria-label={
                      rdDate(d + "T12:00:00-04:00") +
                      ": " +
                      items.length +
                      " intervalos reservados, " +
                      blackoutsOn(d).length +
                      " bloqueos"
                    }
                    onClick={() => setDate(d)}
                  >
                    <time dateTime={d}>{Number(d.slice(-2))}</time>
                    {items.length > 0 && (
                      <>
                        <small>
                          {items.length}{" "}
                          {items.length === 1 ? "intervalo" : "intervalos"}
                        </small>
                        <i aria-hidden="true" />
                      </>
                    )}
                    {blackoutsOn(d).length > 0 && (
                      <small>Bloqueos: {blackoutsOn(d).length}</small>
                    )}
                  </button>
                );
              })}
            </div>
          ) : view === "week" ? (
            <div className={styles.week}>
              {Array.from({ length: 7 }, (_, index) => {
                const d = addDays(start, index);
                return (
                  <div className={styles.weekColumn} key={d}>
                    <h3>
                      {weekdays[new Date(d + "T12:00:00Z").getUTCDay()]}
                      <br />
                      {rdDate(d + "T12:00:00-04:00")}
                    </h3>
                    {blackoutsOn(d).map((b) => (
                      <div className={styles.block} key={b.id}>
                        {b.label}
                        <small>
                          {b.start_time
                            ? b.start_time.slice(0, 5) +
                              " – " +
                              b.end_time?.slice(0, 5)
                            : rdTime(b.starts_at!) + " – " + rdTime(b.ends_at!)}
                        </small>
                      </div>
                    ))}
                    {onDay(d).map(card)}
                    {onDay(d).length === 0 && (
                      <small className={ui.muted}>Sin reservas</small>
                    )}
                    <button
                      className={ui.secondary}
                      type="button"
                      onClick={() => {
                        setDate(d);
                        setView("day");
                      }}
                    >
                      Ver día
                    </button>
                  </div>
                );
              })}
            </div>
          ) : view === "day" ? (
            <div className={styles.list}>
              {onDay(date).map(card)}
              {!onDay(date).length && (
                <p className={styles.empty}>
                  No hay intervalos reservados para este día.
                </p>
              )}
            </div>
          ) : (
            <>
              <label className={ui.field}>
                Filtrar las citas cargadas
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(appointmentStatuses).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.list}>
                {visibleList.map((a) => (
                  <button
                    className={styles.card}
                    type="button"
                    data-state={a.status}
                    key={a.id}
                    onClick={() => void select(a.id)}
                  >
                    <strong>
                      {rdDate(a.starts_at)} · {rdTime(a.starts_at)}
                    </strong>
                    {a.client.name}
                    <small>
                      {appointmentStatuses[a.status]} ·{" "}
                      {appointmentKinds[a.kind]}
                    </small>
                  </button>
                ))}
              </div>
              <p className={ui.muted}>
                {data.appointments.length} registros cargados en el intervalo
                actual. Puedes consultar fechas históricas con el selector y el
                historial completo desde cada cliente.
              </p>
              <div className={ui.actions}>
                <button
                  className={ui.secondary}
                  type="button"
                  disabled={busy || listPage === 0}
                  onClick={async () => {
                    const next = listPage - 1;
                    try {
                      setData(
                        await agendaGet<AgendaWorkspace>(
                          "kind=appointments&page=" +
                            next +
                            "&from=" +
                            encodeURIComponent(start + "T00:00:00-04:00") +
                            "&until=" +
                            encodeURIComponent(until + "T00:00:00-04:00"),
                        ),
                      );
                      setListPage(next);
                    } catch (e) {
                      setError(
                        e instanceof Error
                          ? e.message
                          : "No se pudo cargar la página.",
                      );
                    }
                  }}
                >
                  Página anterior
                </button>
                <button
                  className={ui.secondary}
                  type="button"
                  disabled={busy || data.appointments.length < 300}
                  onClick={async () => {
                    const next = listPage + 1;
                    try {
                      setData(
                        await agendaGet<AgendaWorkspace>(
                          "kind=appointments&page=" +
                            next +
                            "&from=" +
                            encodeURIComponent(start + "T00:00:00-04:00") +
                            "&until=" +
                            encodeURIComponent(until + "T00:00:00-04:00"),
                        ),
                      );
                      setListPage(next);
                    } catch (e) {
                      setError(
                        e instanceof Error
                          ? e.message
                          : "No se pudo cargar la página.",
                      );
                    }
                  }}
                >
                  Página siguiente
                </button>
              </div>
            </>
          )}
          <div style={{ marginTop: 28 }}>
            <h3>{rdDate(date + "T12:00:00-04:00")}</h3>
            {view === "month" && onDay(date).map(card)}
            <h3>Bloqueos personales</h3>
            {blackouts.length ? (
              blackouts.map((b) => (
                <div key={b.id} className={styles.block}>
                  {b.label}
                  <br />
                  {b.starts_at
                    ? `${rdTime(b.starts_at)} – ${rdTime(b.ends_at!)}`
                    : `${b.start_time?.slice(0, 5)} – ${b.end_time?.slice(0, 5)} · semanal`}
                </div>
              ))
            ) : (
              <p className={ui.muted}>
                Sin bloqueos registrados para esta fecha.
              </p>
            )}
            <label className={ui.field}>
              Inicios libres para
              <select
                value={freeKind}
                onChange={(e) => setFreeKind(e.target.value)}
              >
                {Object.entries(appointmentKinds).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label} ·{" "}
                    {
                      data.settings.durations[
                        key as keyof typeof appointmentKinds
                      ]
                    }{" "}
                    min
                  </option>
                ))}
              </select>
            </label>
            {freeLoading ? (
              <p role="status">Consultando disponibilidad…</p>
            ) : free.length ? (
              <div className={styles.free}>
                {free.map((s) => (
                  <span key={s.startsAt}>{rdTime(s.startsAt)}</span>
                ))}
              </div>
            ) : (
              <p className={ui.muted}>
                Sin inicios libres para la fecha y duración seleccionadas.
              </p>
            )}
          </div>
        </section>
        <aside className={styles.details} aria-label="Detalles de la cita">
          {selected ? (
            <AppointmentDetails
              key={selected.id}
              appointment={selected}
              settings={data.settings}
              readOnly={readOnly}
              busy={busy}
              perform={perform}
              canViewLead={data.access.leads}
            />
          ) : (
            <div className={ui.panel}>
              <h2>Selecciona una solicitud</h2>
              <p className={ui.muted}>
                Abre una reserva del calendario o la lista para revisar el
                cliente, sus datos, el historial y las acciones disponibles.
              </p>
            </div>
          )}
        </aside>
      </div>
      {data.access.notifications && (
        <NotificationCenter
          initial={data}
          readOnly={readOnly}
          onOpen={(id) => void select(id)}
          onProcessed={() => void reload().catch((e) => setError(e.message))}
        />
      )}
    </main>
  );
}
function AppointmentDetails({
  appointment: a,
  settings,
  readOnly,
  busy,
  perform,
  canViewLead,
}: {
  appointment: AppointmentRow;
  settings: AgendaWorkspace["settings"];
  readOnly: boolean;
  busy: boolean;
  perform: (
    input: Record<string, unknown>,
    message: string,
  ) => Promise<boolean>;
  canViewLead: boolean;
}) {
  const now = useAgendaClock();
  const [operation, setOperation] = useState(""),
    [instructions, setInstructions] = useState(a.instructions),
    [note, setNote] = useState(""),
    [day, setDay] = useState(""),
    [slot, setSlot] = useState<Slot | null>(null);
  const proposal = a.proposals.find((p) => p.status === "pending");
  const disabled = readOnly || busy;
  const apply = async (action: string) => {
    const data: Record<string, unknown> = {
      ...(note ? { note } : {}),
      ...(instructions ? { instructions } : {}),
      ...(action === "propose" && slot ? { startsAt: slot.startsAt } : {}),
    };
    if (
      await perform(
        {
          action: "appointment",
          id: a.id,
          operation: action,
          expected: a.version,
          data,
        },
        action === "note"
          ? "Nota privada guardada."
          : "Solicitud actualizada y avisos registrados en la cola.",
      )
    ) {
      setOperation("");
      setNote("");
    }
  };
  return (
    <section className={ui.panel}>
      <span className={ui.badge} data-state={a.status}>
        {appointmentStatuses[a.status]}
      </span>
      <h2>{a.client.name}</h2>
      <dl className={ui.summary}>
        {[
          ["Tipo", appointmentKinds[a.kind]],
          ["Fecha", rdDate(a.starts_at)],
          ["Hora", rdTime(a.starts_at)],
          [
            "Duración",
            Math.round(
              (Date.parse(a.ends_at) - Date.parse(a.starts_at)) / 60000,
            ) +
              " min + " +
              a.buffer_minutes +
              " min de margen",
          ],
          ["Modalidad", a.modality === "virtual" ? "Virtual" : "Presencial"],
          [
            "Propiedad",
            a.property_snapshot
              ? a.property_snapshot.reference +
                " · " +
                a.property_snapshot.title
              : "Consulta general",
          ],
          ["Teléfono", a.client.phone || "Datos eliminados"],
          ["Correo", a.client.email || "Datos eliminados"],
          ["Comentarios", a.comments || "Sin comentarios"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {a.status === "pending" && (
        <p className={ui.muted}>
          Reserva provisional hasta {rdDate(a.hold_expires_at)},{" "}
          {rdTime(a.hold_expires_at)}.
        </p>
      )}
      {a.instructions && (
        <p className={ui.notice}>Instrucciones: {a.instructions}</p>
      )}
      {canViewLead && (
        <Link
          className={ui.secondary}
          href={"/admin/clientes-potenciales?cliente=" + a.lead_id}
        >
          Abrir ficha del cliente
        </Link>
      )}
      <div className={ui.actions}>
        {a.status === "pending" && (
          <>
            <button
              type="button"
              className={ui.primary}
              disabled={disabled}
              onClick={() => setOperation("confirm")}
            >
              Confirmar cita
            </button>
            <button
              type="button"
              className={ui.secondary}
              disabled={disabled}
              onClick={() => setOperation("reject")}
            >
              Rechazar solicitud
            </button>
          </>
        )}
        {["pending", "confirmed"].includes(a.status) && (
          <button
            className={ui.secondary}
            type="button"
            disabled={disabled}
            onClick={() => setOperation("propose")}
          >
            Proponer otra fecha
          </button>
        )}
        {[
          "pending",
          "confirmed",
          "change_proposed",
          "reschedule_requested",
        ].includes(a.status) && (
          <button
            className={ui.danger}
            type="button"
            disabled={disabled}
            onClick={() => setOperation("cancel")}
          >
            Cancelar cita
          </button>
        )}
        {a.status === "confirmed" && (
          <>
            <button
              className={ui.secondary}
              type="button"
              disabled={disabled || now < Date.parse(a.ends_at)}
              onClick={() => setOperation("complete")}
            >
              Marcar completada
            </button>
            <button
              className={ui.secondary}
              type="button"
              disabled={disabled || now < Date.parse(a.starts_at) + 900000}
              onClick={() => setOperation("no_show")}
            >
              Cliente no asistió
            </button>
          </>
        )}
        <button
          className={ui.secondary}
          type="button"
          disabled={disabled}
          onClick={() => setOperation("note")}
        >
          Añadir nota privada
        </button>
      </div>
      {proposal && (
        <div className={ui.notice}>
          <h3>Horario propuesto</h3>
          <p>
            {rdDate(proposal.starts_at)} · {rdTime(proposal.starts_at)}
            <br />
            Vence: {rdDate(proposal.expires_at)}, {rdTime(proposal.expires_at)}
          </p>
          <p>
            {proposal.initiated_by === "client"
              ? "El cliente solicita este cambio. La cita original sigue reservada hasta que lo apruebes."
              : "Falta que el cliente acepte esta propuesta."}
          </p>
          <div className={ui.actions}>
            {proposal.initiated_by === "client" && (
              <button
                type="button"
                className={ui.primary}
                disabled={disabled}
                onClick={() => void apply("accept_proposal")}
              >
                Aceptar reprogramación
              </button>
            )}
            <button
              className={ui.secondary}
              type="button"
              disabled={disabled}
              onClick={() => void apply("decline_proposal")}
            >
              {proposal.initiated_by === "thony"
                ? "Retirar propuesta"
                : "Rechazar propuesta"}
            </button>
          </div>
        </div>
      )}
      {operation && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void apply(operation);
          }}
          className={ui.stack}
          style={{ marginTop: 24 }}
        >
          <h3>
            {
              (
                {
                  confirm: "Confirmar cita",
                  reject: "Rechazar solicitud",
                  cancel: "Cancelar cita",
                  propose: "Proponer nueva fecha",
                  note: "Nota privada",
                  complete: "Completar cita",
                  no_show: "Registrar inasistencia",
                } as Record<string, string>
              )[operation]
            }
          </h3>
          {["confirm", "propose"].includes(operation) && (
            <label className={ui.field}>
              Lugar o instrucciones confirmadas
              <textarea
                required
                minLength={3}
                maxLength={1500}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={disabled}
              />
              <small>
                Introduce únicamente un lugar o enlace real y autorizado. Se
                compartirá con el cliente.
              </small>
            </label>
          )}
          {operation === "propose" && (
            <AppointmentDatePicker
              source={"/api/admin/citas?kind=availability&appointment=" + a.id}
              day={day}
              onDay={(value) => {
                setDay(value);
                setSlot(null);
              }}
              slot={slot?.startsAt || ""}
              onSlot={setSlot}
              horizon={settings.booking_horizon_days}
            />
          )}
          <label className={ui.field}>
            {operation === "note" ? "Nota privada" : "Motivo o nota interna"}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              required={["reject", "note"].includes(operation)}
              minLength={operation === "reject" ? 3 : 1}
              disabled={disabled}
            />
            <small>
              Estas notas no se incluyen en los mensajes al cliente.
            </small>
          </label>
          {["cancel", "reject", "complete", "no_show"].includes(operation) && (
            <p className={ui.notice}>
              Se registrará esta decisión en el historial. Las citas completadas
              o canceladas no vuelven a pendiente.
            </p>
          )}
          <div className={ui.actions}>
            <button
              className={operation === "cancel" ? ui.danger : ui.primary}
              type="submit"
              disabled={disabled || (operation === "propose" && !slot)}
            >
              {busy ? "Guardando…" : "Confirmar acción"}
            </button>
            <button
              type="button"
              className={ui.secondary}
              disabled={busy}
              onClick={() => setOperation("")}
            >
              Volver sin cambios
            </button>
          </div>
        </form>
      )}
      <h3 style={{ marginTop: 28 }}>Historial privado</h3>
      <ol className={ui.timeline}>
        {a.history.map((h) => (
          <li key={h.id}>
            <time dateTime={h.created_at}>
              {rdDate(h.created_at)} · {rdTime(h.created_at)}
            </time>
            {historyLabel(h.event)}
            {typeof h.details.note === "string" && h.details.note && (
              <p>{h.details.note}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
