"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { ArrowRight, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import {
  emptyFilters,
  filterProperties,
  formatPrice,
  properties,
  type PropertyFilters,
} from "@/data/properties";
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
      transition={{ duration: reduced ? 0 : motionTiming.fast, ease: editorialEase }}
      inert={!present}
      aria-hidden={present ? undefined : true}
      data-catalog-result=""
      data-present={present}
    >
      {children}
    </motion.div>
  );
}

export function Catalog() {
  const [filters, setFilters] = useState<PropertyFilters>(emptyFilters);
  const [view, setView] = useState<"all" | "featured">("all");
  const [expanded, setExpanded] = useState(false);
  const filterPanel = useRef<HTMLDivElement>(null);
  const filterToggle = useRef<HTMLButtonElement>(null);
  const allTab = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const filtered = filterProperties(filters).filter(
    (p) => view === "all" || p.featured,
  );
  const featuredCount = properties.filter((property) => property.featured).length;
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
    <section id="propiedades" className={`catalog section-pad ${styles.catalog}`}>
      <div className="section-eyebrow">
        <span className="gold-line" /> ESPACIOS CON POSIBILIDADES{" "}
        <span className="section-number">01 /</span>
      </div>
      <div className={`section-heading ${styles.heading}`}>
        <h2>
          Encuentra tu
          <br />
          <em>próximo lugar.</em>
        </h2>
        <div className="section-heading-copy">
          <p>
            Cada búsqueda es personal. Explora, imagina y conversemos sobre lo
            que estás buscando.
          </p>
          <span className="demo-note">
            <span /> Catálogo de demostración · Sin ofertas reales
          </span>
        </div>
      </div>
      <noscript>
        <style>{`.${styles.interactive} { display: none !important; }`}</style>
        <p className={styles.noScript}>
          Explora las {properties.length} propiedades de demostración. Activa
          JavaScript para filtrar esta selección.
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
              aria-pressed={view === "all"}
              className={view === "all" ? "active" : ""}
              onClick={() => setView("all")}
            >
              Todas las propiedades{" "}
              <span aria-hidden="true">
                {String(properties.length).padStart(2, "0")}
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
                : expanded ? "Ocultar" : "Mostrar"}
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
              <option>Apartamento</option>
              <option>Villa</option>
              <option>Penthouse</option>
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
              <option>Santo Domingo</option>
              <option>Punta Cana</option>
              <option>Santiago</option>
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
            {view === "featured" && (
              <button
                onClick={() => {
                  setView("all");
                  allTab.current?.focus({ preventScroll: true });
                }}
                aria-label="Quitar selección de destacadas"
              >
                Destacadas <X size={13} aria-hidden="true" />
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
            {filtered.length === 1
              ? "propiedad de demostración"
              : "propiedades de demostración"}
          </p>
          {active && (
            <button onClick={reset}>
              <RotateCcw size={14} aria-hidden="true" />
              Limpiar filtros
            </button>
          )}
        </div>
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
            Prueba otra combinación para explorar el catálogo de demostración.
          </p>
          <button className="button button-outline" onClick={reset}>
            Limpiar filtros <ArrowRight size={16} aria-hidden="true" />
          </button>
        </motion.div>
      )}
      <p className="catalog-disclaimer">
        Las imágenes, ubicaciones y precios son ilustrativos. Consulta con Thony
        para conocer propiedades y disponibilidad reales.
      </p>
    </section>
  );
}
