import {
  propertyOperations,
  propertyTypes,
  type PropertyOperation,
  type PropertyType,
} from "@/data/property-options";
import type { PropertyRow, StoredImage } from "@/data/property-row";

// Estado del formulario del panel. Se valida igual en navegador y servidor.
export type PropertyInput = {
  id?: string;
  scope?: "enterprise";
  version?: number;
  title: string;
  slug: string;
  reference: string;
  location: string;
  neighborhood: string;
  type: PropertyType;
  operation: PropertyOperation;
  price: number | null;
  priceProvisional: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  parking: number | null;
  description: string;
  amenities: string[];
  images: StoredImage[];
  featured: boolean;
  demo: boolean;
  inPreparation: boolean;
  imagesAreRenders: boolean;
  projectName: string;
  projectFacts: string[];
  projectTypologies: string[];
  confirmationNote: string;
  brochurePath: string | null;
  brochureLabel: string;
  sortOrder: number | null;
  published: boolean;
};

export const emptyPropertyInput: PropertyInput = {
  title: "",
  slug: "",
  reference: "",
  location: "",
  neighborhood: "",
  type: "Apartamento",
  operation: "Venta",
  price: null,
  priceProvisional: false,
  bedrooms: null,
  bathrooms: null,
  area: null,
  parking: null,
  description: "",
  amenities: [],
  images: [],
  featured: false,
  demo: false,
  inPreparation: false,
  imagesAreRenders: false,
  projectName: "",
  projectFacts: [],
  projectTypologies: [],
  confirmationNote: "",
  brochurePath: null,
  brochureLabel: "",
  sortOrder: null,
  published: true,
};

/** "Villa Mar Azul, Cap Cana" → "villa-mar-azul-cap-cana" */
export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Devuelve el primer problema encontrado, en lenguaje claro, o null. */
export function validatePropertyInput(input: PropertyInput): string | null {
  if (!input.title.trim()) return "Escribe el nombre de la propiedad.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug))
    return "La dirección web solo puede tener letras minúsculas, números y guiones.";
  if (!input.reference.trim())
    return "Escribe una referencia interna (por ejemplo ALB-002).";
  if (!propertyTypes.includes(input.type)) return "Elige el tipo de propiedad.";
  if (!propertyOperations.includes(input.operation))
    return "Elige venta o alquiler.";
  if (input.price === null || !Number.isFinite(input.price) || input.price < 0)
    return "Escribe el precio en USD (solo el número).";
  if (!input.location.trim()) return "Escribe la ciudad o zona.";
  if (!input.description.trim()) return "Escribe una descripción.";
  if (!input.images.length) return "Sube al menos una foto.";
  const missingAlt = input.images.findIndex((image) => !image.alt.trim());
  if (missingAlt !== -1)
    return `Describe brevemente la foto ${missingAlt + 1} (qué se ve en ella).`;
  for (const [label, value] of [
    ["Habitaciones", input.bedrooms],
    ["Baños", input.bathrooms],
    ["Superficie", input.area],
    ["Parqueos", input.parking],
  ] as const) {
    if (value !== null && (!Number.isFinite(value) || value < 0))
      return `${label}: escribe un número válido o déjalo vacío.`;
  }
  return null;
}

const clean = (list: string[]) =>
  list.map((item) => item.trim()).filter(Boolean);

export function inputToRow(input: PropertyInput): Omit<PropertyRow, "id"> {
  return {
    slug: input.slug,
    reference: input.reference.trim(),
    title: input.title.trim(),
    location: input.location.trim(),
    neighborhood: input.neighborhood.trim(),
    type: input.type,
    operation: input.operation,
    price: input.price ?? 0,
    price_provisional: input.priceProvisional,
    bedrooms: input.bedrooms === null ? null : Math.round(input.bedrooms),
    bathrooms: input.bathrooms,
    area: input.area,
    parking: input.parking === null ? null : Math.round(input.parking),
    description: input.description.trim(),
    amenities: clean(input.amenities),
    images: input.images.map((image) => ({
      path: image.path,
      alt: image.alt.trim(),
    })),
    featured: input.featured,
    demo: input.demo,
    in_preparation: !input.demo && input.inPreparation,
    images_are_renders: input.imagesAreRenders,
    project_name: input.projectName.trim() || null,
    project_facts: clean(input.projectFacts),
    project_typologies: clean(input.projectTypologies),
    confirmation_note: input.confirmationNote.trim() || null,
    brochure_path: input.brochurePath,
    brochure_label: input.brochurePath
      ? input.brochureLabel.trim() || null
      : null,
    sort_order: input.sortOrder,
    published: input.published,
  };
}

export function rowToInput(row: PropertyRow): PropertyInput {
  return {
    id: row.id,
    ...(row.organization_id
      ? { scope: "enterprise" as const, version: row.version || 0 }
      : {}),
    title: row.title,
    slug: row.slug,
    reference: row.reference,
    location: row.location,
    neighborhood: row.neighborhood,
    type: row.type,
    operation: row.operation,
    price: Number(row.price),
    priceProvisional: row.price_provisional,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms === null ? null : Number(row.bathrooms),
    area: row.area === null ? null : Number(row.area),
    parking: row.parking,
    description: row.description,
    amenities: row.amenities ?? [],
    images: row.images ?? [],
    featured: row.featured,
    demo: row.demo,
    inPreparation: row.in_preparation,
    imagesAreRenders: row.images_are_renders,
    projectName: row.project_name ?? "",
    projectFacts: row.project_facts ?? [],
    projectTypologies: row.project_typologies ?? [],
    confirmationNote: row.confirmation_note ?? "",
    brochurePath: row.brochure_path,
    brochureLabel: row.brochure_label ?? "",
    sortOrder: row.sort_order,
    published: row.published,
  };
}
