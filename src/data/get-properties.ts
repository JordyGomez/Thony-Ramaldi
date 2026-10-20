import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/env";
import { sampleProperties, type Property } from "./properties";
import { rowToProperty, type PropertyRow } from "./property-row";
import { getPlatformSnapshot } from "./get-platform";

// Límite de datos legados para consumidores que acepten caché. Las páginas
// públicas verifican la identidad por petición y usan renderizado dinámico.
export const PROPERTIES_REVALIDATE = 60;

/**
 * Fuente única de propiedades para las páginas públicas: solo las fichas
 * publicadas en el panel /admin. Si la tabla está vacía, la web no muestra
 * propiedades. Las fixtures requieren una autorización explícita de pruebas
 * y nunca se activan en un despliegue de Vercel.
 */
export const getProperties = cache(async (): Promise<Property[]> => {
  if (!isSupabaseConfigured) {
    return process.env.THONY_TEST_FIXTURES === "1" && !process.env.VERCEL_ENV
      ? sampleProperties
      : [];
  }
  const snapshot = await getPlatformSnapshot();
  if (snapshot)
    return snapshot.properties
      .map(rowToProperty)
      .filter((property) => property.images.length > 0);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          next: { revalidate: PROPERTIES_REVALIDATE, tags: ["properties"] },
        }),
    },
  });
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("published", true)
    .eq("demo", false)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  // Un fallo no equivale a inventario vacío ni permite cambiar de identidad.
  // Las rutas dinámicas muestran un error hasta recuperar una lectura válida.
  if (error) {
    console.error("No se pudieron leer las propiedades de Supabase:", error);
    throw new Error("Supabase no respondió al leer las propiedades.");
  }
  return (data as PropertyRow[])
    .map(rowToProperty)
    .filter((property) => property.images.length > 0);
});
