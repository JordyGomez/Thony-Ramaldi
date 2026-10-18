import { storagePublicUrl } from "@/lib/supabase/env";
import type { PropertyOperation, PropertyType } from "./property-options";
import type { Property } from "./properties";

// Una foto guardada: ruta dentro del bucket y descripción para lectores de pantalla.
export type StoredImage = { path: string; alt: string };

// Fila de la tabla public.properties (ver supabase/schema.sql).
export type PropertyRow = {
  id: string;
  slug: string;
  reference: string;
  title: string;
  location: string;
  neighborhood: string;
  type: PropertyType;
  operation: PropertyOperation;
  price: number;
  price_provisional: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  parking: number | null;
  description: string;
  amenities: string[];
  images: StoredImage[];
  featured: boolean;
  demo: boolean;
  in_preparation: boolean;
  images_are_renders: boolean;
  project_name: string | null;
  project_facts: string[] | null;
  project_typologies: string[] | null;
  confirmation_note: string | null;
  brochure_path: string | null;
  brochure_label: string | null;
  sort_order: number | null;
  published: boolean;
};

const emptyToUndefined = (list: string[] | null) =>
  list && list.length ? list : undefined;

export function rowToProperty(row: PropertyRow): Property {
  return {
    slug: row.slug,
    reference: row.reference,
    title: row.title,
    location: row.location,
    neighborhood: row.neighborhood,
    type: row.type,
    operation: row.operation,
    price: Number(row.price),
    currency: "USD",
    priceProvisional: row.price_provisional,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms === null ? null : Number(row.bathrooms),
    area: row.area === null ? null : Number(row.area),
    parking: row.parking,
    description: row.description,
    amenities: row.amenities ?? [],
    images: (row.images ?? []).map((image) => ({
      src: storagePublicUrl(image.path),
      alt: image.alt || row.title,
    })),
    featured: row.featured,
    demo: row.demo,
    inPreparation: !row.demo && row.in_preparation,
    imagesAreRenders: row.images_are_renders,
    projectName: row.project_name ?? undefined,
    projectFacts: emptyToUndefined(row.project_facts),
    projectTypologies: emptyToUndefined(row.project_typologies),
    confirmationNote: row.confirmation_note ?? undefined,
    brochure: row.brochure_path
      ? {
          href: storagePublicUrl(row.brochure_path),
          label: row.brochure_label || "Ver folleto del proyecto (PDF)",
        }
      : undefined,
  };
}
