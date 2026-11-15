"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
  formatPrice,
  listingStatus,
  listingStatusLabel,
  type Property,
} from "@/data/properties";
import { COMPARE_KEY, COMPARE_MAX, useSavedList } from "@/lib/saved-lists";
import styles from "./compare-tray.module.css";

const unknown = "Por confirmar";

/** Comparador de dos a cuatro propiedades con datos reales de cada ficha. */
export function CompareTray({ properties }: { properties: Property[] }) {
  const { list, toggle, clear } = useSavedList(COMPARE_KEY, COMPARE_MAX);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = list
    .map((slug) => properties.find((property) => property.slug === slug))
    .filter((property): property is Property => Boolean(property));
  useEffect(() => {
    if (selected.length < 2 && dialog.current?.open) dialog.current.close();
  }, [selected.length]);
  if (!selected.length) return null;
  const rows: [string, (property: Property) => string][] = [
    [
      "Precio",
      (p) =>
        `USD ${formatPrice(p.price)}${p.operation === "Alquiler" ? " / mes" : ""}${p.priceProvisional ? " (provisional)" : ""}`,
    ],
    ["Operación", (p) => p.operation],
    ["Tipo", (p) => p.type],
    ["Ubicación", (p) => p.location],
    ["Sector", (p) => p.neighborhood || unknown],
    ["Superficie", (p) => (p.area != null ? `${p.area} m²` : unknown)],
    ["Habitaciones", (p) => (p.bedrooms != null ? String(p.bedrooms) : unknown)],
    ["Baños", (p) => (p.bathrooms != null ? String(p.bathrooms) : unknown)],
    ["Parqueos", (p) => (p.parking != null ? String(p.parking) : unknown)],
    ["Amenidades", (p) => (p.amenities.length ? p.amenities.join(", ") : unknown)],
    ["Estado", (p) => listingStatusLabel[listingStatus(p)]],
  ];
  return (
    <>
      <div className={styles.tray} role="region" aria-label="Comparador">
        <p>
          {selected.length === 1
            ? "1 propiedad en el comparador. Añade otra para comparar."
            : `${selected.length} propiedades en el comparador.`}
        </p>
        <div>
          <button
            type="button"
            className="button button-solid"
            disabled={selected.length < 2}
            onClick={() => dialog.current?.showModal()}
          >
            Comparar
          </button>
          <button type="button" className={styles.clear} onClick={clear}>
            Vaciar
          </button>
        </div>
      </div>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="compare-title"
      >
        <header>
          <h2 id="compare-title">Comparar propiedades</h2>
          <button
            type="button"
            aria-label="Cerrar comparador"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} strokeWidth={1.25} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.scroll} tabIndex={0}>
          <table>
            <thead>
              <tr>
                <td />
                {selected.map((property) => (
                  <th scope="col" key={property.slug}>
                    <Link href={`/propiedades/${property.slug}`}>
                      {property.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggle(property.slug)}
                      aria-label={`Quitar ${property.title} del comparador`}
                    >
                      Quitar
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {selected.map((property) => (
                    <td key={property.slug}>{value(property)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          Confirma con Thony precio, disponibilidad y condiciones antes de
          decidir.
        </p>
      </dialog>
    </>
  );
}
