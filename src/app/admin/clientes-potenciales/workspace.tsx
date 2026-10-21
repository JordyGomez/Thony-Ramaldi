"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { agendaGet, agendaPost } from "@/components/appointments/admin-api";
import {
  appointmentKinds,
  appointmentStatuses,
  leadStatuses,
  rdDate,
  rdTime,
  type AgendaWorkspace,
  type Lead,
  type AppointmentRow,
  type HistoryEntry,
} from "@/lib/appointments/types";
import styles from "@/components/appointments/admin.module.css";
import ui from "@/components/appointments/agenda.module.css";
type LeadDetail = {
  lead: Lead;
  appointments: AppointmentRow[];
  history: HistoryEntry[];
  totalHistory: number;
  totalAppointments: number;
};
type Filters = {
  query: string;
  status: string;
  from: string;
  until: string;
  property: string;
  sort: string;
  page: number;
};
export function LeadsWorkspace({
  initial,
  readOnly,
  initialSelection,
}: {
  initial: AgendaWorkspace;
  readOnly: boolean;
  initialSelection?: string;
}) {
  const [data, setData] = useState(initial),
    [selected, setSelected] = useState<LeadDetail | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [filters, setFilters] = useState<Filters>({
      query: "",
      status: "",
      from: "",
      until: "",
      property: "",
      sort: "newest",
      page: 0,
    }),
    [applied, setApplied] = useState<Filters>(filters),
    [exportApproved, setExportApproved] = useState(false),
    [historyPage, setHistoryPage] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const open = useCallback(async (id: string) => {
    try {
      const detail = await agendaGet<LeadDetail>("kind=lead&id=" + id);
      setError("");
      setSelected(detail);
      setHistoryPage(0);
      setTimeout(() => heading.current?.focus({ preventScroll: true }), 0);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos consultar la ficha.",
      );
    }
  }, []);
  useEffect(() => {
    if (!initialSelection) return;
    const c = new AbortController();
    agendaGet<LeadDetail>("kind=lead&id=" + initialSelection, c.signal)
      .then((detail) => setSelected(detail))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [initialSelection]);
  const search = async (next: Filters) => {
    setBusy(true);
    setError("");
    try {
      const end = next.until ? new Date(next.until + "T00:00:00-04:00") : null;
      if (end) end.setUTCDate(end.getUTCDate() + 1);
      const result = await agendaPost<
        Pick<AgendaWorkspace, "leads" | "leadTotal" | "leadProperties">
      >({
        action: "search_leads",
        filters: {
          ...next,
          from: next.from ? next.from + "T00:00:00-04:00" : undefined,
          until: end?.toISOString(),
        },
      });
      setData((previous) => ({ ...previous, ...result }));
      setApplied(next);
      setFilters(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos buscar los clientes.",
      );
    } finally {
      setBusy(false);
    }
  };
  const perform = async (
    operation: string,
    payload: Record<string, unknown>,
  ) => {
    if (!selected) return false;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await agendaPost({
        action: "lead",
        id: selected.lead.id,
        operation,
        data: payload,
        expected: selected.lead.version,
      });
      const refreshed = await agendaGet<LeadDetail>(
        "kind=lead&id=" + selected.lead.id,
      );
      setSelected(refreshed);
      setNotice(
        operation === "anonymize"
          ? "Datos de contacto y notas eliminados; enlaces personales revocados."
          : "Cambio guardado en el historial privado.",
      );
      await search(applied);
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos guardar. Los datos del formulario se conservan.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };
  const exportCsv = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export" }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error);
      }
      const url = URL.createObjectURL(await r.blob()),
        a = document.createElement("a");
      a.href = url;
      a.download = "clientes-thony.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(
        "Exportación descargada y registrada en auditoría. Conserva el archivo de forma privada.",
      );
      setExportApproved(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo exportar.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main id="contenido" className={styles.main}>
      <div className={styles.top}>
        <div>
          <p className={ui.eyebrow}>
            Relaciones inmobiliarias · Acceso restringido
          </p>
          <h1>Clientes potenciales de Thony</h1>
          <p>
            Datos, citas y seguimiento de las personas que solicitaron atención.
            La asistencia a una cita no cambia automáticamente su estado
            comercial a cerrado.
          </p>
        </div>
        {data.access.manage && (
          <Link className={ui.secondary} href="/admin/citas">
            Volver a la agenda
          </Link>
        )}
      </div>
      {readOnly && (
        <p className={ui.notice}>
          Preview de lectura: puedes consultar la interfaz, pero no modificar
          clientes ni exportar datos.
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
        <h2>Buscar y filtrar</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void search({ ...filters, page: 0 });
          }}
        >
          <label className={ui.field}>
            Nombre, teléfono o correo
            <input
              type="search"
              value={filters.query}
              maxLength={160}
              autoComplete="off"
              onChange={(e) =>
                setFilters({ ...filters, query: e.target.value })
              }
            />
          </label>
          <div className={styles.filters}>
            <label className={ui.field}>
              Estado comercial
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">Todos</option>
                {Object.entries(leadStatuses).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className={ui.field}>
              Primer contacto desde
              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters({ ...filters, from: e.target.value })
                }
              />
            </label>
            <label className={ui.field}>
              Primer contacto hasta
              <input
                type="date"
                value={filters.until}
                onChange={(e) =>
                  setFilters({ ...filters, until: e.target.value })
                }
              />
            </label>
            <label className={ui.field}>
              Propiedad consultada
              <select
                value={filters.property}
                onChange={(e) =>
                  setFilters({ ...filters, property: e.target.value })
                }
              >
                <option value="">Todas</option>
                {data.leadProperties?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.reference} · {p.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={ui.field}>
              Ordenar
              <select
                value={filters.sort}
                onChange={(e) =>
                  setFilters({ ...filters, sort: e.target.value })
                }
              >
                <option value="newest">Última interacción</option>
                <option value="oldest">Primer contacto</option>
                <option value="name">Nombre</option>
              </select>
            </label>
          </div>
          <div className={ui.actions}>
            <button type="submit" className={ui.primary} disabled={busy}>
              {busy ? "Consultando…" : "Buscar clientes"}
            </button>
            <button
              type="button"
              className={ui.secondary}
              disabled={busy}
              onClick={() =>
                void search({
                  query: "",
                  status: "",
                  from: "",
                  until: "",
                  property: "",
                  sort: "newest",
                  page: 0,
                })
              }
            >
              Limpiar filtros
            </button>
          </div>
        </form>
        <p className={ui.muted}>
          Las búsquedas se consultan en la base de datos y no se incluyen en la
          URL ni en el historial del navegador.
        </p>
      </section>
      <div className={styles.leadGrid} style={{ marginTop: 24 }}>
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 400, marginBottom: 18 }}>
            {data.leadTotal ?? data.leads?.length ?? 0} clientes en esta
            selección
          </h2>
          <div className={styles.list}>
            {data.leads?.map((lead) => (
              <article key={lead.id} className={styles.lead}>
                <span className={ui.badge}>
                  {leadStatuses[lead.commercial_status]}
                </span>
                <h2>{lead.name}</h2>
                <p>
                  {lead.phone || "Contacto eliminado"}
                  <br />
                  {lead.email || ""}
                </p>
                <p>
                  Interés: {appointmentKinds[lead.interest] || lead.interest}
                  <br />
                  Última interacción: {rdDate(lead.last_interaction_at)} ·{" "}
                  {rdTime(lead.last_interaction_at)}
                </p>
                {lead.duplicateCandidates.length > 0 && (
                  <p className={ui.notice}>
                    Posibles coincidencias con otras fichas. No se ha fusionado
                    ningún cliente.
                  </p>
                )}
                <button
                  type="button"
                  className={ui.secondary}
                  disabled={busy}
                  onClick={() => void open(lead.id)}
                >
                  Abrir ficha de {lead.name}
                </button>
              </article>
            ))}
          </div>
          {!data.leads?.length && (
            <p className={styles.empty}>
              No hay clientes que coincidan con estos filtros.
            </p>
          )}
          <div className={ui.actions}>
            <button
              type="button"
              className={ui.secondary}
              disabled={busy || applied.page === 0}
              onClick={() =>
                void search({ ...applied, page: applied.page - 1 })
              }
            >
              Página anterior
            </button>
            <span className={ui.muted}>Página {applied.page + 1}</span>
            <button
              type="button"
              className={ui.secondary}
              disabled={
                busy || (applied.page + 1) * 50 >= (data.leadTotal || 0)
              }
              onClick={() =>
                void search({ ...applied, page: applied.page + 1 })
              }
            >
              Página siguiente
            </button>
          </div>
        </section>
        <aside className={styles.details}>
          {selected ? (
            <LeadCard
              key={selected.lead.id}
              detail={selected}
              heading={heading}
              busy={busy}
              readOnly={readOnly}
              canManageAppointments={data.access.manage}
              perform={perform}
              onOpen={(id) => void open(id)}
              more={async () => {
                try {
                  const next = historyPage + 1,
                    r = await agendaGet<LeadDetail>(
                      `kind=lead&id=${selected.lead.id}&page=${next}`,
                    );
                  setSelected((previous) =>
                    previous
                      ? {
                          ...previous,
                          appointments: [
                            ...previous.appointments,
                            ...r.appointments,
                          ],
                          history: [...previous.history, ...r.history],
                        }
                      : previous,
                  );
                  setHistoryPage(next);
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "No se pudo cargar el historial.",
                  );
                }
              }}
            />
          ) : (
            <div className={ui.panel}>
              <h2>Selecciona un cliente</h2>
              <p className={ui.muted}>
                Abre una ficha para consultar sus citas, notas privadas, tareas
                y estado comercial.
              </p>
            </div>
          )}
        </aside>
      </div>
      {data.access.export && (
        <section className={ui.panel} style={{ marginTop: 24 }}>
          <h2>Exportación privada</h2>
          <p className={ui.muted}>
            Descarga los clientes de Thony en CSV. Incluye datos de contacto, no
            notas privadas. La exportación requiere un permiso adicional y queda
            registrada.
          </p>
          <label className={ui.check}>
            <input
              type="checkbox"
              checked={exportApproved}
              onChange={(e) => setExportApproved(e.target.checked)}
              disabled={readOnly || busy}
            />
            <span>
              Entiendo que el archivo contiene información personal y lo
              conservaré únicamente para la relación inmobiliaria autorizada.
            </span>
          </label>
          <button
            type="button"
            className={ui.secondary}
            disabled={readOnly || busy || !exportApproved}
            onClick={() => void exportCsv()}
          >
            Exportar todos los clientes (CSV)
          </button>
        </section>
      )}
    </main>
  );
}
function LeadCard({
  detail,
  heading,
  busy,
  readOnly,
  canManageAppointments,
  perform,
  onOpen,
  more,
}: {
  detail: LeadDetail;
  heading: React.RefObject<HTMLHeadingElement | null>;
  busy: boolean;
  readOnly: boolean;
  canManageAppointments: boolean;
  perform: (
    operation: string,
    data: Record<string, unknown>,
  ) => Promise<boolean>;
  onOpen: (id: string) => void;
  more: () => Promise<void>;
}) {
  const lead = detail.lead;
  const [status, setStatus] = useState(lead.commercial_status),
    [note, setNote] = useState(""),
    [deletion, setDeletion] = useState(false);
  const disabled = busy || readOnly || !!lead.anonymized_at;
  return (
    <section className={ui.panel}>
      <span className={ui.badge}>{leadStatuses[lead.commercial_status]}</span>
      <h2 tabIndex={-1} ref={heading}>
        {lead.name}
      </h2>
      <dl className={ui.summary}>
        {[
          ["Teléfono", lead.phone || "Eliminado"],
          ["Correo", lead.email || "Eliminado"],
          ["Interés", appointmentKinds[lead.interest] || lead.interest],
          [
            "Fuente",
            lead.source === "property"
              ? "Ficha de propiedad"
              : "Página de citas",
          ],
          ["Primer contacto", rdDate(lead.first_contact_at)],
          [
            "Última interacción",
            rdDate(lead.last_interaction_at) +
              " · " +
              rdTime(lead.last_interaction_at),
          ],
          [
            "Responsable",
            lead.responsible_user_id
              ? "Thony Paulino"
              : "Pendiente de asignación",
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={ui.actions}>
        {lead.email && (
          <a href={"mailto:" + lead.email} className={ui.secondary}>
            Abrir correo (manual)
          </a>
        )}
        {lead.phone && lead.whatsapp_consent_at && (
          <a
            href={"https://wa.me/" + lead.phone.replace(/\D/g, "")}
            target="_blank"
            rel="noopener noreferrer"
            className={ui.secondary}
          >
            Abrir WhatsApp (manual)
          </a>
        )}
      </div>
      <p className={ui.muted}>
        Los enlaces de contacto abren tu aplicación; no envían mensajes
        automáticamente. El consentimiento operativo no autoriza publicidad.
      </p>
      <form
        className={ui.stack}
        style={{ marginTop: 24 }}
        onSubmit={(e) => {
          e.preventDefault();
          void perform("status", { status });
        }}
      >
        <label className={ui.field}>
          Estado comercial
          <select
            value={status}
            disabled={disabled}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            {Object.entries(leadStatuses).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={ui.primary} disabled={disabled}>
          Guardar estado comercial
        </button>
      </form>
      {lead.duplicateCandidates?.length > 0 && (
        <div className={ui.notice}>
          <h3>Posibles coincidencias</h3>
          <p>
            Un teléfono familiar o correo compartido no prueba que sea la misma
            persona.
          </p>
          {lead.duplicateCandidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className={ui.secondary}
              onClick={() => onOpen(candidate.id)}
            >
              Revisar {candidate.name}
            </button>
          ))}
        </div>
      )}
      {lead.appointmentCounts && (
        <p className={ui.notice}>
          Solicitudes: {lead.appointmentCounts.requested} · Confirmadas en
          historial: {lead.appointmentCounts.confirmed} · Completadas:{" "}
          {lead.appointmentCounts.completed}
        </p>
      )}
      <h3 style={{ marginTop: 26 }}>Notas privadas</h3>
      <form
        className={ui.stack}
        onSubmit={async (e) => {
          e.preventDefault();
          if (await perform("note", { body: note })) setNote("");
        }}
      >
        <label className={ui.field}>
          Nueva nota interna
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={4000}
            required
            disabled={disabled}
          />
        </label>
        <button type="submit" className={ui.secondary} disabled={disabled}>
          Guardar nota del cliente
        </button>
      </form>
      <ul className={ui.timeline}>
        {lead.notes?.map((n) => (
          <li key={n.id}>
            <time dateTime={n.created_at}>
              {rdDate(n.created_at)} · {rdTime(n.created_at)}
            </time>
            {n.body}
          </li>
        ))}
      </ul>
      <h3>Tareas de seguimiento</h3>
      {lead.tasks?.map((task) => (
        <div className={styles.rule} key={task.id}>
          <span>
            {task.title}
            <br />
            {rdDate(task.due_at)} · {rdTime(task.due_at)}
            <br />
            {task.status === "done"
              ? "Completada"
              : task.status === "cancelled"
                ? "Cancelada"
                : "Pendiente"}
          </span>
          {task.status === "open" && (
            <div className={ui.actions}>
              <button
                className={ui.secondary}
                type="button"
                disabled={disabled}
                onClick={() =>
                  void perform("task_status", { id: task.id, status: "done" })
                }
              >
                Completar tarea
              </button>
              <button
                className={ui.secondary}
                type="button"
                disabled={disabled}
                onClick={() =>
                  void perform("task_status", {
                    id: task.id,
                    status: "cancelled",
                  })
                }
              >
                Cancelar tarea
              </button>
            </div>
          )}
        </div>
      ))}
      <form
        className={ui.stack}
        style={{ marginTop: 18 }}
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget,
            f = new FormData(form);
          if (
            await perform("task", {
              title: f.get("title"),
              dueAt: String(f.get("dueAt")) + ":00-04:00",
            })
          )
            form.reset();
        }}
      >
        <label className={ui.field}>
          Título del seguimiento
          <input
            name="title"
            required
            maxLength={240}
            minLength={2}
            disabled={disabled}
          />
        </label>
        <label className={ui.field}>
          Fecha y hora (RD)
          <input
            type="datetime-local"
            name="dueAt"
            required
            disabled={disabled}
          />
        </label>
        <button className={ui.secondary} type="submit" disabled={disabled}>
          Crear tarea privada
        </button>
      </form>
      <h3 style={{ marginTop: 26 }}>Citas e interacciones</h3>
      {detail.appointments.map((a) => (
        <div className={styles.rule} key={a.id}>
          <span>
            {rdDate(a.starts_at)} · {rdTime(a.starts_at)}
            <br />
            {appointmentKinds[a.kind]} · {appointmentStatuses[a.status]}
            <br />
            {a.property_snapshot?.reference || "Consulta general"}
          </span>
          {canManageAppointments && (
            <Link
              className={ui.secondary}
              href={"/admin/citas?solicitud=" + a.id}
            >
              Abrir cita
            </Link>
          )}
        </div>
      ))}
      <ol className={ui.timeline}>
        {detail.history.map((h) => (
          <li key={h.id}>
            <time dateTime={h.created_at}>
              {rdDate(h.created_at)} · {rdTime(h.created_at)}
            </time>
            {h.to_status && h.to_status in appointmentStatuses
              ? appointmentStatuses[
                  h.to_status as keyof typeof appointmentStatuses
                ]
              : h.event.startsWith("lead_")
                ? "Actualización de la ficha"
                : h.event === "note"
                  ? "Nota de cita"
                  : h.event.replace(/_/g, " ")}
            {typeof h.details.note === "string" && h.details.note && (
              <p>{h.details.note}</p>
            )}
          </li>
        ))}
      </ol>
      {(detail.history.length < detail.totalHistory ||
        detail.appointments.length < detail.totalAppointments) && (
        <button
          className={ui.secondary}
          type="button"
          onClick={() => void more()}
        >
          Cargar historial anterior
        </button>
      )}
      {lead.duplicateCandidates?.length > 0 &&
        detail.appointments.some(
          (a) =>
            ![
              "pending",
              "confirmed",
              "change_proposed",
              "reschedule_requested",
            ].includes(a.status),
        ) && (
          <details className={styles.job}>
            <summary>
              Relacionar una solicitud finalizada con otra ficha
            </summary>
            <p>
              Solo mueve la relación de una solicitud finalizada. No fusiona
              clientes ni mueve notas. Sus enlaces de cliente anteriores se
              revocan.
            </p>
            <form
              className={ui.stack}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void perform("link_appointment", {
                  appointmentId: f.get("appointmentId"),
                  targetLeadId: f.get("targetLeadId"),
                });
              }}
            >
              <label className={ui.field}>
                Solicitud finalizada
                <select name="appointmentId" required disabled={disabled}>
                  {detail.appointments
                    .filter(
                      (a) =>
                        ![
                          "pending",
                          "confirmed",
                          "change_proposed",
                          "reschedule_requested",
                        ].includes(a.status),
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {rdDate(a.starts_at)} · {appointmentStatuses[a.status]}
                      </option>
                    ))}
                </select>
              </label>
              <label className={ui.field}>
                Ficha de destino
                <select name="targetLeadId" required disabled={disabled}>
                  <option value="">
                    Selecciona tras verificar la identidad
                  </option>
                  {lead.duplicateCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={ui.check}>
                <input type="checkbox" required disabled={disabled} />
                <span>
                  Verifiqué que esta relación corresponde al cliente correcto.
                </span>
              </label>
              <button
                type="submit"
                className={ui.secondary}
                disabled={disabled}
              >
                Relacionar solicitud
              </button>
            </form>
          </details>
        )}
      {!lead.anonymized_at && (
        <details className={styles.job}>
          <summary>Eliminar datos personales de esta ficha</summary>
          <p>
            Primero deben resolverse las citas activas. Se eliminan contactos,
            notas y capacidades personales; el historial mínimo de estados se
            conserva.
          </p>
          <label className={ui.check}>
            <input
              type="checkbox"
              checked={deletion}
              onChange={(e) => setDeletion(e.target.checked)}
              disabled={disabled}
            />
            <span>
              Verifiqué la solicitud de supresión y entiendo que la eliminación
              no se puede deshacer.
            </span>
          </label>
          <button
            type="button"
            className={ui.danger}
            disabled={disabled || !deletion}
            onClick={() =>
              void perform("anonymize", {
                confirmation: "ELIMINAR DATOS PERSONALES",
              })
            }
          >
            Eliminar contactos y notas
          </button>
        </details>
      )}
    </section>
  );
}
