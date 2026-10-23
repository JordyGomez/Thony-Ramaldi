"use client";
import { ArrowUpRight } from "lucide-react";
import { useState, useId } from "react";
import Link from "next/link";
import { projectPrice, type ProjectUnit } from "@/lib/project-units";
import styles from "./project.module.css";
export function ProjectUnits({
  units,
  slug,
  title,
  whatsapp,
  advisorName,
  preview = false,
}: {
  units: ProjectUnit[];
  slug: string;
  title: string;
  whatsapp: string;
  advisorName: string;
  preview?: boolean;
}) {
  const filterId = useId();
  const [building, setBuilding] = useState("all"),
    [selected, setSelected] = useState(units[0].unit);
  const active = units.find((u) => u.unit === selected) || units[0],
    visible = units.filter(
      (u) => building === "all" || u.building === building,
    );
  const contact = new URL(`https://wa.me/${whatsapp.replace(/\D/g, "")}`);
  contact.searchParams.set(
    "text",
    `Hola ${advisorName}, me interesa ${title}, unidad ${active.unit}, edificio ${active.building}, ${active.area} m², precio de referencia ${projectPrice(active.priceMinorUnits)}. ¿Me confirmas disponibilidad, ubicación exacta y condiciones?`,
  );
  return (
    <section
      className={styles.section}
      id="unidades"
      aria-labelledby="units-title"
    >
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Encuentra tu referencia</p>
          <h2 id="units-title">Compara. Elige. Conversemos.</h2>
        </div>
        <p>
          {units.length} referencias en el listado facilitado. La selección no
          reserva ni confirma disponibilidad.
        </p>
      </div>
      <div className={styles.unitLayout}>
        <div>
          <label className={styles.filter}>
            <span>Edificio</span>
            <select
              aria-label="Edificio"
              id={filterId}
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
            >
              <option value="all">Todos los edificios</option>
              {Array.from(new Set(units.map((u) => u.building))).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.unitList} aria-label="Unidades del listado">
            {visible.map((u) => (
              <button
                type="button"
                className={styles.unitCard}
                key={u.unit}
                aria-pressed={active.unit === u.unit}
                onClick={() => setSelected(u.unit)}
              >
                <span className={styles.unitNumber}>
                  {u.unit}
                  <small>Edificio {u.building}</small>
                </span>
                <span>
                  {u.area} m²
                  <small>
                    {u.bedrooms} hab. · {u.bathrooms} baños · {u.parking}{" "}
                    parqueos
                  </small>
                </span>
                <strong>{projectPrice(u.priceMinorUnits)}</strong>
              </button>
            ))}
          </div>
        </div>
        <aside className={styles.selection} aria-label="Unidad seleccionada">
          <p className={styles.eyebrow}>Tu selección</p>
          <h3>Unidad {active.unit}</h3>
          <p>
            Edificio {active.building} · {active.area} m²
          </p>
          <strong className={styles.selectedPrice}>
            {projectPrice(active.priceMinorUnits)}
          </strong>
          <dl className={styles.specs}>
            {[
              ["Habitaciones", active.bedrooms],
              ["Baños", active.bathrooms],
              ["Parqueos", active.parking],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <a
            className={styles.primary}
            aria-disabled={preview || undefined}
            tabIndex={preview ? -1 : undefined}
            href={preview ? undefined : contact.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar unidad {active.unit}{" "}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <Link
            className={styles.secondary}
            aria-disabled={preview || undefined}
            tabIndex={preview ? -1 : undefined}
            href={
              preview
                ? "/admin/proyectos/treo-ii"
                : "/citas?propiedad=" + encodeURIComponent(slug)
            }
          >
            {preview ? (
              "Publicación pendiente"
            ) : (
              <>
                Solicitar visita al proyecto{" "}
                <ArrowUpRight size={16} aria-hidden="true" />
              </>
            )}
          </Link>
          <p className={styles.muted}>
            Contacto manual por WhatsApp. Thony confirma precio final,
            disponibilidad, sector y condiciones antes de cualquier compromiso.
          </p>
        </aside>
      </div>
    </section>
  );
}
