import Link from "next/link";
import type { PropertyRow } from "@/data/property-row";
import styles from "./dashboard.module.css";

import type { AgendaSummary } from "@/lib/appointments/summary";

type Alert = { id: string; title: string; reasons: string[] };

/** Fichas visibles en la web a las que les falta información. */
export function propertyAlerts(rows: PropertyRow[]): Alert[] {
  return rows
    .filter((row) => row.published && !row.demo)
    .map((row) => ({
      id: row.id,
      title: row.title,
      reasons: [
        !row.images?.length && "sin fotografías",
        row.images?.some((image) => !image.alt?.trim()) &&
          "fotos sin descripción accesible",
        (row.description || "").trim().length < 60 && "descripción muy breve",
        row.price_provisional && "precio provisional",
        [row.bedrooms, row.bathrooms, row.area].some((value) => value === null) &&
          "habitaciones, baños o superficie por confirmar",
        !row.neighborhood?.trim() && "sector sin indicar",
      ].filter((reason): reason is string => Boolean(reason)),
    }))
    .filter((alert) => alert.reasons.length > 0);
}

const when = (iso: string) =>
  new Intl.DateTimeFormat("es-DO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Santo_Domingo",
  }).format(new Date(iso));

/** Resumen operativo con datos reales del panel; sin cifras estimadas. */
export function Dashboard({
  rows,
  agenda,
}: {
  rows: PropertyRow[];
  agenda: AgendaSummary | null;
}) {
  const real = rows.filter((row) => !row.demo);
  const stats: [string, number, string?][] = [
    ["Propiedades", rows.length],
    ["Publicadas en la web", real.filter((row) => row.published).length],
    ["Ocultas", rows.filter((row) => !row.published).length],
    ["En preparación", real.filter((row) => row.in_preparation).length],
    ["Destacadas", rows.filter((row) => row.featured).length],
  ];
  const alerts = propertyAlerts(rows);
  return (
    <section className={styles.dashboard} aria-label="Resumen del panel">
      <dl className={styles.stats}>
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.columns}>
        <div className={styles.card}>
          <h2>Citas</h2>
          {agenda ? (
            <>
              <p>
                <strong>{agenda.pending}</strong> por confirmar ·{" "}
                <strong>{agenda.upcoming}</strong> confirmadas próximas
              </p>
              <p className={styles.muted}>
                {agenda.next
                  ? `Próxima: ${when(agenda.next)}`
                  : "No hay visitas confirmadas por delante."}
              </p>
              {(agenda.workerError || (agenda.notificationErrors ?? 0) > 0) && (
                <p className={styles.warning} role="alert">
                  {agenda.workerError
                    ? "El procesador de avisos registró un error. "
                    : ""}
                  {(agenda.notificationErrors ?? 0) > 0
                    ? `${agenda.notificationErrors} avisos con error.`
                    : ""}
                </p>
              )}
              <p className={styles.links}>
                <Link href="/admin/citas">Abrir agenda</Link>
                {agenda.leads && (
                  <Link href="/admin/clientes-potenciales">
                    Clientes potenciales
                  </Link>
                )}
              </p>
            </>
          ) : (
            <p className={styles.muted}>
              Tu cuenta no tiene la agenda asignada o todavía no está
              activada. Los datos de clientes solo son visibles para quien
              tiene ese permiso.
            </p>
          )}
        </div>
        <div className={styles.card}>
          <h2>Fichas publicadas por completar</h2>
          {alerts.length ? (
            <div className={styles.alerts}>
              {alerts.slice(0, 6).map((alert) => (
                <p key={alert.id}>
                  <Link href={`/admin/${alert.id}`}>{alert.title}</Link>
                  <span>{alert.reasons.join(" · ")}</span>
                </p>
              ))}
              {alerts.length > 6 && (
                <p className={styles.muted}>
                  y {alerts.length - 6} más en el listado.
                </p>
              )}
            </div>
          ) : (
            <p className={styles.muted}>
              {real.some((row) => row.published)
                ? "Las fichas publicadas tienen fotos, descripción y datos completos."
                : "Todavía no hay fichas reales publicadas."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
