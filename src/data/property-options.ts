// Opciones compartidas por el catálogo y el panel /admin.
export const propertyTypes = ["Apartamento", "Villa", "Penthouse"] as const;
export const propertyOperations = ["Venta", "Alquiler"] as const;

export type PropertyType = (typeof propertyTypes)[number];
export type PropertyOperation = (typeof propertyOperations)[number];
