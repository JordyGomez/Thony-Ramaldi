import type { Property } from "@/data/properties";

export type FooterPropertyImage = Property["images"][number] & { title: string };

/** Recibe solo el inventario público; las demos y los renders no sirven de foto. */
export function footerPropertyImage(
  properties: Property[],
): FooterPropertyImage | undefined {
  const property = properties.find(
    (item) => !item.demo && !item.imagesAreRenders && item.images.length > 0,
  );
  return property
    ? { ...property.images[0], title: property.title }
    : undefined;
}
