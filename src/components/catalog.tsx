"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import {
  ArrowRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  emptyFilters,
  filterProperties,
  formatPrice,
  listingStatus,
  type Property,
  type PropertyFilters,
} from "@/data/properties";
import { propertyTypes } from "@/data/property-options";
import { editorialEase, motionTiming } from "@/lib/motion";
import { PropertyCard } from "./property-card";
import styles from "./catalog.module.css";

function CatalogResult({ children }: { children: ReactNode }) {
  const present = useIsPresent();
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={styles.result}
      layout={reduced ? false : "position"}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
      transition={{
        duration: reduced ? 0 : motionTiming.fast,
        ease: editorialEase,
      }}
      inert={!present}
      aria-hidden={present ? undefined : true}
      data-catalog-result=""
      data-present={present}
    >
      {children}
    </motion.div>
  );
}

export function Catalog({ properties }: { properties: Property[] }) {
  const [filters, setFilters] = useState<PropertyFilters>(emptyFilters);
  // Las ubicaciones salen de los datos para incluir las que se añadan en el panel.
  const locations = Array.from(
    new Set(properties.map((property) => property.location)),
  ).sort((a, b) => a.localeCompare(b, "es"));
  const [view, setView] = useState<"all" | "real" | "featured">("all");
  const [expanded, setExpanded] = useState(false);
  const filterPanel = useRef<HTMLDivElement>(null);
  const filterToggle = useRef<HTMLButtonElement>(null);
  const allTab = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const filtered = filterProperties(properties, filters).filter(
    (p) => view === "all" || (view === "real" ? !p.demo : p.featured),
  );
  const featuredCount = properties.filter(
    (property) => property.featured,
  ).length;
  const realCount = properties.filter((property) => !property.demo).length;
  const countByStatus = (list: Property[]) => ({
    available: list.filter((p) => listingStatus(p) === "available").length,
    preparation: list.filter((p) => listingStatus(p) === "preparation").length,
    demo: list.filter((p) => listingStatus(p) === "demo").length,
  });
  const totals = countByStatus(properties);
  const shown = countByStatus(filtered);
  const filteredRealCount = shown.available + shown.preparation;
  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;
  // Solo se nombran los grupos presentes: "2 disponibles · 1 en preparación…".
  const summary = [
    totals.available && plural(totals.available, "disponible", "disponibles"),
    totals.preparation &&
      plural(totals.preparation, "ficha en preparación", "fichas en preparación"),
    totals.demo &&
      plural(totals.demo, "ficha de demostración", "fichas de demostración"),
  ]
    .filter(Boolean)
    .join(" · ");
  const activeFilters = (
    Object.entries(filters) as [keyof PropertyFilters, string][]
  ).filter(([, value]) => Boolean(value));
  const active = activeFilters.length > 0 || view !== "all";
  const change = (key: keyof PropertyFilters, value: string) =>
    setFilters((previous) => ({ ...previous, [key]: value }));
  const reset = () => {
    setFilters(emptyFilters);
    setView("all");
    allTab.current?.focus({ preventScroll: true });
  };
  const filterLabel = (key: keyof PropertyFilters, value: string) => {
    switch (key) {
      case "type":
        return `Tipo: ${value}`;
      case "operation":
        return `Operación: ${value}`;
      case "location":
        return `Ubicación: ${value}`;
      case "price":
        return `Hasta USD ${formatPrice(Number(value))}${filters.operation === "Alquiler" ? " / mes" : ""}`;
      case "bedrooms":
        return `${value} o más habitaciones`;
    }
  };
  const removeFilter = (key: keyof PropertyFilters) => {
    setFilters((previous) => ({
      ...previous,
      [key]: "",
      ...(key === "operation" ? { price: "" } : {}),
    }));
    const select = filterPanel.current?.querySelector<HTMLSelectElement>(
      `[name="catalog-${key}"]`,
    );
    if (select?.getClientRects().length) select.focus({ preventScroll: true });
    else filterToggle.current?.focus({ preventScroll: true });
  };
  return (
    <section
      id="propiedades"
      className={`catalog section-pad ${styles.catalog}`}
    >
      <div className={`section-heading ${styles.heading}`}>
        <h2>
          Encuentra tu <strong>próximo lugar</strong>
        </h2>
        <div className="section-heading-copy">
          <p>
            Cada búsqueda es personal. Explora, imagina y conversemos sobre lo
            que estás buscando.
          </p>
          <span className="demo-note">{summary}</span>
        </div>
      </div>
      <noscript>
        <style>{`.${styles.interactive} { display: none !important; }`}</style>
        <p className={styles.noScript}>
          Explora {summary}. Activa JavaScript para filtrar esta selección.
        </p>
      </noscript>
      <div className={styles.interactive}>
        <div className={`catalog-toolbar ${styles.toolbar}`}>
          <div
            className={`catalog-tabs ${styles.tabs}`}
            role="group"
            aria-label="Selección de propiedades"
          >
            <button
              ref={allTab}
              aria-label="Todas las propiedades"
              aria-pressed={view === "all"}
              className={view === "all" ? "active" : ""}
              onClick={() => setView("all")}
            >
              Todas{" "}
              <span aria-hidden="true">
                {String(properties.length).padStart(2, "0")}
              </span>
            </button>
            <button
              aria-pressed={view === "real"}
              className={view === "real" ? "active" : ""}
              onClick={() => setView("real")}
            >
              Reales{" "}
              <span aria-hidden="true">
                {String(realCount).padStart(2, "0")}
              </span>
            </button>
            <button
              aria-pressed={view === "featured"}
              className={view === "featured" ? "active" : ""}
              onClick={() => setView("featured")}
            >
              Destacadas{" "}
              <span aria-hidden="true">
                {String(featuredCount).padStart(2, "0")}
              </span>
            </button>
          </div>
          <button
            ref={filterToggle}
            className={`filter-toggle ${styles.toggle}`}
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls="catalog-filters"
            aria-label="Filtros"
          >
            <span>
              <SlidersHorizontal size={17} aria-hidden="true" /> Filtros
            </span>
            <span aria-hidden="true">
              {activeFilters.length
                ? `${activeFilters.length} activos`
                : expanded
                  ? "Ocultar"
                  : "Mostrar"}
            </span>
          </button>
        </div>
        <div
          ref={filterPanel}
          className={`filter-grid ${expanded ? "expanded" : ""} ${styles.filters}`}
          id="catalog-filters"
        >
          <label>
            Tipo de propiedad
            <select
              name="catalog-type"
              aria-label="Tipo de propiedad"
              value={filters.type}
              onChange={(e) => change("type", e.target.value)}
            >
              <option value="">Todos</option>
              {propertyTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Operación
            <select
              name="catalog-operation"
              aria-label="Operación"
              value={filters.operation}
              onChange={(e) => {
                setFilters((previous) => ({
                  ...previous,
                  operation: e.target.value,
                  price: "",
                }));
              }}
            >
              <option value="">Todas</option>
              <option>Venta</option>
              <option>Alquiler</option>
            </select>
          </label>
          <label>
            Ubicación
            <select
              name="catalog-location"
              aria-label="Ubicación"
              value={filters.location}
              onChange={(e) => change("location", e.target.value)}
            >
              <option value="">Todas</option>
              {locations.map((location) => (
                <option key={location}>{location}</option>
              ))}
            </select>
          </label>
          <label>
            {filters.operation === "Alquiler"
              ? "Máximo USD / mes"
              : "Precio máximo (USD)"}
            <select
              name="catalog-price"
              aria-label={
                filters.operation === "Alquiler"
                  ? "Máximo USD / mes"
                  : "Precio máximo (USD)"
              }
              value={filters.price}
              onChange={(e) => change("price", e.target.value)}
            >
              <option value="">Sin límite</option>
              {(filters.operation === "Alquiler"
                ? [1500, 2500, 4000]
                : [200000, 300000, 400000, 500000]
              ).map((price) => (
                <option key={price} value={price}>
                  {new Intl.NumberFormat("es-DO").format(price)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Habitaciones
            <select
              name="catalog-bedrooms"
              aria-label="Habitaciones"
              value={filters.bedrooms}
              onChange={(e) => change("bedrooms", e.target.value)}
            >
              <option value="">Sin mínimo</option>
              <option value="1">1 o más</option>
              <option value="2">2 o más</option>
              <option value="3">3 o más</option>
              <option value="4">4 o más</option>
            </select>
          </label>
        </div>
        {active && (
          <div
            className={styles.activeFilters}
            role="group"
            aria-label="Filtros activos"
          >
            {view !== "all" && (
              <button
                onClick={() => {
                  setView("all");
                  allTab.current?.focus({ preventScroll: true });
                }}
                aria-label={
                  view === "real"
                    ? "Quitar selección de propiedades reales"
                    : "Quitar selección de destacadas"
                }
              >
                {view === "real" ? "Propiedades reales" : "Destacadas"}{" "}
                <X size={13} aria-hidden="true" />
              </button>
            )}
            {activeFilters.map(([key, value]) => (
              <button
                key={key}
                onClick={() => removeFilter(key)}
                aria-label={`Quitar filtro ${filterLabel(key, value)}`}
              >
                {filterLabel(key, value)} <X size={13} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        <div className={`results-row ${styles.results}`}>
          <p role="status" aria-live="polite">
            {filtered.length}{" "}
            {filteredRealCount === 0
              ? filtered.length === 1
                ? "propiedad de demostración"
                : "propiedades de demostración"
              : [
                  filtered.length === 1 ? "propiedad" : "propiedades",
                  shown.available &&
                    plural(shown.available, "disponible", "disponibles"),
                  shown.preparation && `${shown.preparation} en preparación`,
                  shown.demo && `${shown.demo} de demostración`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
          {active && (
            <button onClick={reset}>
              <RotateCcw size={14} aria-hidden="true" />
              Limpiar filtros
            </button>
          )}
        </div>
        {filters.price && (
          <p className="catalog-disclaimer">
            Los importes provisionales no participan en el filtro de precio.
          </p>
        )}
      </div>
      <div className={`property-grid ${styles.grid}`}>
        <AnimatePresence initial={false}>
          {filtered.map((property, i) => (
            <CatalogResult key={property.slug}>
              <PropertyCard property={property} index={i} />
            </CatalogResult>
          ))}
        </AnimatePresence>
      </div>
      {!filtered.length && (
        <motion.div
          className={`empty-state ${styles.empty}`}
          initial={false}
          animate={reduced ? {} : { opacity: [0.5, 1], y: [8, 0] }}
          transition={{
            duration: reduced ? 0 : motionTiming.normal,
            ease: editorialEase,
          }}
        >
          <Search size={32} strokeWidth={1} aria-hidden="true" />
          <h3>No hay coincidencias todavía.</h3>
          <p>
            Prueba otra combinación para explorar el catálogo. Las fichas con
            renta provisional o datos desconocidos no se incluyen en esos
            rangos.
          </p>
          <button className="button button-outline" onClick={reset}>
            Limpiar filtros <ArrowRight size={16} aria-hidden="true" />
          </button>
        </motion.div>
      )}
      <p className="catalog-disclaimer">
        {properties.some((p) => p.slug === "alberobello-residences") &&
          "Alberobello: ficha real en preparación, con renta provisional y renders del proyecto. "}
        {totals.demo > 0 &&
          "Las fichas “Demostración” usan datos e imágenes ilustrativos. "}
        Confirma con Thony la unidad, disponibilidad y condiciones antes de
        decidir.
      </p>
    </section>
  );
}
