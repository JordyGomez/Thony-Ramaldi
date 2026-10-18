"use client";

import { useState } from "react";
import { ArrowRight, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import {
  emptyFilters,
  filterProperties,
  type PropertyFilters,
} from "@/data/properties";
import { PropertyCard } from "./property-card";

export function Catalog() {
  const [filters, setFilters] = useState<PropertyFilters>(emptyFilters);
  const [view, setView] = useState<"all" | "featured">("all");
  const [expanded, setExpanded] = useState(false);
  const filtered = filterProperties(filters).filter(
    (p) => view === "all" || p.featured,
  );
  const active = Object.values(filters).some(Boolean) || view !== "all";
  const change = (key: keyof PropertyFilters, value: string) =>
    setFilters((previous) => ({ ...previous, [key]: value }));
  const reset = () => {
    setFilters(emptyFilters);
    setView("all");
  };
  return (
    <section id="propiedades" className="catalog section-pad">
      <div className="section-eyebrow">
        <span className="gold-line" /> ESPACIOS CON POSIBILIDADES{" "}
        <span className="section-number">01 /</span>
      </div>
      <div className="section-heading">
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
      <div className="catalog-toolbar">
        <div
          className="catalog-tabs"
          role="group"
          aria-label="Selección de propiedades"
        >
          <button
            aria-pressed={view === "all"}
            className={view === "all" ? "active" : ""}
            onClick={() => setView("all")}
          >
            Todas las propiedades
          </button>
          <button
            aria-pressed={view === "featured"}
            className={view === "featured" ? "active" : ""}
            onClick={() => setView("featured")}
          >
            Destacadas <span>03</span>
          </button>
        </div>
        <button
          className="filter-toggle"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls="catalog-filters"
        >
          <SlidersHorizontal size={16} />
          Filtros
        </button>
      </div>
      <div
        className={`filter-grid ${expanded ? "expanded" : ""}`}
        id="catalog-filters"
      >
        <label>
          Tipo de propiedad
          <select
            aria-label="Tipo de propiedad"
            value={filters.type}
            onChange={(e) => change("type", e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option>Apartamento</option>
            <option>Villa</option>
            <option>Penthouse</option>
          </select>
        </label>
        <label>
          Operación
          <select
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
            <option value="">Venta y alquiler</option>
            <option>Venta</option>
            <option>Alquiler</option>
          </select>
        </label>
        <label>
          Ubicación
          <select
            aria-label="Ubicación"
            value={filters.location}
            onChange={(e) => change("location", e.target.value)}
          >
            <option value="">Todas las ubicaciones</option>
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
            aria-label="Habitaciones"
            value={filters.bedrooms}
            onChange={(e) => change("bedrooms", e.target.value)}
          >
            <option value="">Cualquier cantidad</option>
            <option value="1">1 o más</option>
            <option value="2">2 o más</option>
            <option value="3">3 o más</option>
            <option value="4">4 o más</option>
          </select>
        </label>
      </div>
      <div className="results-row">
        <p role="status" aria-live="polite">
          {filtered.length}{" "}
          {filtered.length === 1
            ? "propiedad de demostración"
            : "propiedades de demostración"}
        </p>
        {active && (
          <button onClick={reset}>
            <RotateCcw size={13} />
            Limpiar filtros
          </button>
        )}
      </div>
      {filtered.length ? (
        <div className="property-grid">
          {filtered.map((property, i) => (
            <PropertyCard property={property} index={i} key={property.slug} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={32} strokeWidth={1} />
          <h3>No hay coincidencias todavía.</h3>
          <p>
            Prueba otra combinación para explorar el catálogo de demostración.
          </p>
          <button className="button button-outline" onClick={reset}>
            Limpiar filtros <ArrowRight size={16} />
          </button>
        </div>
      )}
      <p className="catalog-disclaimer">
        Las imágenes, ubicaciones y precios son ilustrativos. Consulta con Thony
        para conocer propiedades y disponibilidad reales.
      </p>
    </section>
  );
}
