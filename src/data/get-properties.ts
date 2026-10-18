import { cache } from "react";
import { createClient } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import {
  isSanityConfigured,
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "@/sanity/env";
import { properties as localProperties, type Property } from "./properties";

// Segundos que una página publicada puede mostrar datos anteriores del panel.
export const PROPERTIES_REVALIDATE = 60;

const propertiesQuery = `*[_type == "property" && defined(slug.current)]
  | order(coalesce(order, 9999) asc, title asc) {
    "slug": slug.current,
    reference, title, location, neighborhood, type, operation,
    price, priceProvisional, bedrooms, bathrooms, area, parking,
    description, amenities, featured, demo, inPreparation, imagesAreRenders,
    projectName, projectFacts, projectTypologies, confirmationNote,
    images[]{ alt, asset, crop, hotspot },
    "brochureUrl": brochure.asset->url,
    brochureLabel
  }`;

type SanityImage = {
  alt?: string;
  asset?: { _ref: string };
  crop?: unknown;
  hotspot?: unknown;
};
type SanityProperty = Omit<
  Property,
  "images" | "brochure" | "currency" | "amenities" | "featured" | "demo"
> & {
  images?: SanityImage[] | null;
  amenities?: string[] | null;
  featured?: boolean | null;
  demo?: boolean | null;
  brochureUrl?: string | null;
  brochureLabel?: string | null;
};

const toProperty =
  (imageUrl: ReturnType<typeof createImageUrlBuilder>) =>
  (doc: SanityProperty): Property => ({
    ...doc,
    currency: "USD",
    bedrooms: doc.bedrooms ?? null,
    bathrooms: doc.bathrooms ?? null,
    area: doc.area ?? null,
    parking: doc.parking ?? null,
    amenities: doc.amenities ?? [],
    featured: Boolean(doc.featured),
    demo: Boolean(doc.demo),
    inPreparation: !doc.demo && Boolean(doc.inPreparation),
    imagesAreRenders: Boolean(doc.imagesAreRenders),
    priceProvisional: Boolean(doc.priceProvisional),
    projectName: doc.projectName ?? undefined,
    projectFacts: doc.projectFacts ?? undefined,
    projectTypologies: doc.projectTypologies ?? undefined,
    confirmationNote: doc.confirmationNote ?? undefined,
    images: (doc.images ?? [])
      .filter((image) => image.asset)
      .map((image) => ({
        src: imageUrl
          .image(image)
          .width(2400)
          .fit("max")
          .auto("format")
          .url(),
        alt: image.alt || doc.title,
      })),
    brochure: doc.brochureUrl
      ? {
          href: doc.brochureUrl,
          label: doc.brochureLabel || "Ver folleto del proyecto (PDF)",
        }
      : undefined,
  });

/**
 * Fuente única de propiedades para las páginas públicas.
 * Con Project ID lee el panel /admin; sin él, si falla o si el panel aún no
 * tiene fichas, devuelve los datos locales para que la web nunca quede vacía.
 */
export const getProperties = cache(async (): Promise<Property[]> => {
  if (!isSanityConfigured) return localProperties;
  try {
    const client = createClient({
      projectId: sanityProjectId,
      dataset: sanityDataset,
      apiVersion: sanityApiVersion,
      useCdn: true,
    });
    const docs = await client.fetch<SanityProperty[]>(
      propertiesQuery,
      {},
      { next: { revalidate: PROPERTIES_REVALIDATE, tags: ["property"] } },
    );
    const mapped = docs
      .map(toProperty(createImageUrlBuilder(client)))
      .filter((property) => property.images.length > 0);
    return mapped.length ? mapped : localProperties;
  } catch (error) {
    console.error("No se pudieron leer las propiedades del panel:", error);
    return localProperties;
  }
});
