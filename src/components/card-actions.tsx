"use client";

import { Heart, Scale } from "lucide-react";
import {
  COMPARE_KEY,
  COMPARE_MAX,
  FAVORITES_KEY,
  useSavedList,
} from "@/lib/saved-lists";

/** Guardar en favoritos y añadir al comparador, sin cuenta. */
export function CardActions({ slug, title }: { slug: string; title: string }) {
  const favorites = useSavedList(FAVORITES_KEY);
  const compare = useSavedList(COMPARE_KEY, COMPARE_MAX);
  const saved = favorites.list.includes(slug);
  const comparing = compare.list.includes(slug);
  const full = !comparing && compare.list.length >= COMPARE_MAX;
  return (
    <div className="property-actions">
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => favorites.toggle(slug)}
        title={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
      >
        <Heart
          size={16}
          strokeWidth={1.25}
          fill={saved ? "currentColor" : "none"}
          aria-hidden="true"
        />
        <span>{saved ? "Guardada" : "Guardar"}</span>
        <span className="sr-only"> {title}</span>
      </button>
      <button
        type="button"
        aria-pressed={comparing}
        disabled={full}
        onClick={() => compare.toggle(slug)}
        title={
          full
            ? `Puedes comparar hasta ${COMPARE_MAX} propiedades`
            : comparing
              ? "Quitar del comparador"
              : "Añadir al comparador"
        }
      >
        <Scale size={16} strokeWidth={1.25} aria-hidden="true" />
        <span>{comparing ? "Comparando" : "Comparar"}</span>
        <span className="sr-only"> {title}</span>
      </button>
    </div>
  );
}
