"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
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
  propertySorts,
  sortProperties,
  type Property,
  type PropertyFilters,
  type PropertySort,
} from "@/data/properties";
import { CompareTray } from "./compare-tray";
import { FAVORITES_KEY, useSavedList } from "@/lib/saved-lists";
import { propertyTypes } from "@/data/property-options";
import { editorialEase, motionTiming } from "@/lib/motion";
import { useSite, useExperienceReducedMotion } from "./site-provider";
import { Reveal } from "./reveal";
import { PropertyCard } from "./property-card";
import styles from "./catalog.module.css";

/** Nombres legibles de cada filtro en la URL compartible. */
const urlKeys: Record<keyof PropertyFilters, string> = {
  type: "tipo",
  operation: "operacion",
  location: "ubicacion",
  price: "precio",
  bedrooms: "hab",
  query: "q",
  priceMin: "desde",
  bathrooms: "banos",
  parking: "parqueos",
  areaMin: "m2",
};

function CatalogResult({ children }: { children: ReactNode }) {
  const present = useIsPresent();
  const reduced = useExperienceReducedMotion();

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
  const { settings, contact: site, whatsappUrl } = useSite();
  const t = settings.texts;
  const [filters, setFilters] = useState<PropertyFilters>(emptyFilters);
  // Las ubicaciones salen de los datos para incluir las que se añadan en el panel.
  const locations = Array.from(
    new Set(properties.map((property) => property.location)),
  ).sort((a, b) => a.localeCompare(b, "es"));
  const [view, setView] = useState<"all" | "real" | "featured" | "saved">(
    "all",
  );
  const [sort, setSort] = useState<PropertySort>("");
  const [copied, setCopied] = useState(false);
  const favorites = useSavedList(FAVORITES_KEY);
  // La búsqueda vive también en la URL: se puede compartir y recuperar.
  const urlReady = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = { ...emptyFilters };
    let found = false;
    for (const key of Object.keys(urlKeys) as (keyof PropertyFilters)[]) {
      const value = params.get(urlKeys[key]);
      if (value && value.length <= 80) {
        next[key] = value;
        found = true;
      }
    }
    // Una elección hecha antes de que la página termine de cargar ya está en
    // los controles: se conserva en lugar de perderla al hidratar.
    for (const key of Object.keys(urlKeys) as (keyof PropertyFilters)[]) {
      const control = filterPanel.current?.querySelector<
        HTMLSelectElement | HTMLInputElement
      >(`[name="catalog-${key}"]`);
      if (control?.value) {
        next[key] = control.value;
        found = true;
      }
    }
    const early = filterPanel.current?.querySelector<HTMLSelectElement>(
      '[name="catalog-sort"]',
    )?.value as PropertySort | undefined;
    const order = early || (params.get("orden") as PropertySort | null);
    const selection = params.get("vista");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (found) setFilters(next);
    if (order && propertySorts.some(([value]) => value === order))
      setSort(order);
    if (selection === "real" || selection === "featured" || selection === "saved")
      setView(selection);
    urlReady.current = true;
  }, []);
  useEffect(() => {
    if (!urlReady.current) return;
    const params = new URLSearchParams(window.location.search);
    for (const key of Object.keys(urlKeys) as (keyof PropertyFilters)[]) {
      if (filters[key]) params.set(urlKeys[key], filters[key]);
      else params.delete(urlKeys[key]);
    }
    if (sort) params.set("orden", sort);
    else params.delete("orden");
    if (view !== "all") params.set("vista", view);
    else params.delete("vista");
    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }, [filters, sort, view]);
  const [expanded, setExpanded] = useState(false);
  const filterPanel = useRef<HTMLDivElement>(null);
  const filterToggle = useRef<HTMLButtonElement>(null);
  const allTab = useRef<HTMLButtonElement>(null);
  const reduced = useExperienceReducedMotion();
  const filtered = sortProperties(
    filterProperties(properties, filters).filter(
      (p) =>
        view === "all" ||
        (view === "real"
          ? !p.demo
          : view === "saved"
            ? favorites.list.includes(p.slug)
            : p.featured),
    ),
    sort,
  );
  const savedCount = properties.filter((property) =>
    favorites.list.includes(property.slug),
  ).length;
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
      plural(
        totals.preparation,
        "ficha en preparación",
        "fichas en preparación",
      ),
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
    setSort("");
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
      case "query":
        return `Buscar: ${value}`;
      case "priceMin":
        return `Desde USD ${formatPrice(Number(value))}`;
      case "bathrooms":
        return `${value} o más baños`;
      case "parking":
        return `${value} o más parqueos`;
      case "areaMin":
        return `Desde ${value} m²`;
    }
  };
  const removeFilter = (key: keyof PropertyFilters) => {
    setFilters((previous) => ({
      ...previous,
      [key]: "",
      ...(key === "operation" ? { price: "" } : {}),
    }));
    const select = filterPanel.current?.querySelector<HTMLElement>(
      `[name="catalog-${key}"]`,
    );
    if (select?.getClientRects().length) select.focus({ preventScroll: true });
    else filterToggle.current?.focus({ preventScroll: true });
  };
  // Panel vacío: aún no hay fichas publicadas en /admin.
  if (!properties.length)
    return (
      <section
        id="propiedades"
        className={`catalog section-pad ${styles.catalog}`}
      >
        <Reveal className="empty-state catalog-empty" variant="soft">
          <div className="catalog-empty-copy">
            <span className="label">
              {t.company} · {t.location}
            </span>
            <h2>
              {t.emptyTitle} <strong>{t.emptyEmphasis}</strong>
            </h2>
            <p>{t.emptyDescription}</p>
            <div className="catalog-empty-actions">
              <a
                className="button button-solid"
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.emptyCta} <ArrowRight size={16} aria-hidden="true" />
              </a>
              <a className="link-arrow" href={site.phoneHref}>
                Llamar a Thony <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    );
  return (
    <section
      id="propiedades"
      className={`catalog section-pad ${styles.catalog}`}
    >
      <div className={`section-heading ${styles.heading}`}>
        <h2>
          {t.catalogTitle} <strong>{t.catalogEmphasis}</strong>
        </h2>
        <div className="section-heading-copy">
          <p>{t.catalogDescription}</p>
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
            {(savedCount > 0 || view === "saved") && (
              <button
                aria-pressed={view === "saved"}
                className={view === "saved" ? "active" : ""}
                onClick={() => setView("saved")}
              >
                Favoritas{" "}
                <span aria-hidden="true">
                  {String(savedCount).padStart(2, "0")}
                </span>
              </button>
            )}
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
          <label>
            Buscar
            <input
              type="search"
              name="catalog-query"
              aria-label="Buscar por nombre, sector o código"
              placeholder="Nombre, sector o código"
              maxLength={80}
              value={filters.query}
              onChange={(e) => change("query", e.target.value)}
            />
          </label>
          <label>
            {filters.operation === "Alquiler"
              ? "Mínimo USD / mes"
              : "Precio mínimo (USD)"}
            <select
              name="catalog-priceMin"
              aria-label="Precio mínimo"
              value={filters.priceMin}
              onChange={(e) => change("priceMin", e.target.value)}
            >
              <option value="">Sin mínimo</option>
              {(filters.operation === "Alquiler"
                ? [500, 1000, 2000]
                : [100000, 200000, 300000]
              ).map((price) => (
                <option key={price} value={price}>
                  {new Intl.NumberFormat("es-DO").format(price)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Baños
            <select
              name="catalog-bathrooms"
              aria-label="Baños"
              value={filters.bathrooms}
              onChange={(e) => change("bathrooms", e.target.value)}
            >
              <option value="">Sin mínimo</option>
              <option value="1">1 o más</option>
              <option value="2">2 o más</option>
              <option value="3">3 o más</option>
            </select>
          </label>
          <label>
            Parqueos
            <select
              name="catalog-parking"
              aria-label="Parqueos"
              value={filters.parking}
              onChange={(e) => change("parking", e.target.value)}
            >
              <option value="">Sin mínimo</option>
              <option value="1">1 o más</option>
              <option value="2">2 o más</option>
            </select>
          </label>
          <label>
            Superficie mínima
            <select
              name="catalog-areaMin"
              aria-label="Superficie mínima"
              value={filters.areaMin}
              onChange={(e) => change("areaMin", e.target.value)}
            >
              <option value="">Sin mínimo</option>
              {[60, 100, 150, 250].map((area) => (
                <option key={area} value={area}>
                  {area} m²
                </option>
              ))}
            </select>
          </label>
          <label>
            Ordenar
            <select
              name="catalog-sort"
              aria-label="Ordenar"
              value={sort}
              onChange={(e) => setSort(e.target.value as PropertySort)}
            >
              {propertySorts.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
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
                    : view === "saved"
                      ? "Quitar selección de favoritas"
                      : "Quitar selección de destacadas"
                }
              >
                {view === "real"
                  ? "Propiedades reales"
                  : view === "saved"
                    ? "Favoritas"
                    : "Destacadas"}{" "}
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
          {(active || sort) && (
            <span className={styles.resultActions}>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2500);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? "Enlace copiado" : "Copiar enlace de esta búsqueda"}
              </button>
              <button onClick={reset}>
                <RotateCcw size={14} aria-hidden="true" />
                Limpiar filtros
              </button>
            </span>
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
      <CompareTray properties={properties} />
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
