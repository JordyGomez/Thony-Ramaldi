// Identificadores públicos de Sanity: no son secretos. Sin Project ID el sitio
// usa los datos locales de src/data/properties.ts y /admin muestra un aviso.
export const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const sanityDataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const sanityApiVersion = "2026-09-01";

export const isSanityConfigured = /^[a-z0-9-]+$/.test(sanityProjectId);
