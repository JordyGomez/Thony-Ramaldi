import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/env";
import { sampleProperties, type Property } from "./properties";
import { rowToProperty, type PropertyRow } from "./property-row";

// Segundos que una página puede mostrar datos anteriores si nadie la
// revalida. Guardar en /admin revalida al instante; esto es un respaldo.
export const PROPERTIES_REVALIDATE = 60;

/**
 * Fuente única de propiedades para las páginas públicas: solo las fichas
 * publicadas en el panel /admin. Si la tabla está vacía, la web no muestra
 * propiedades. Con Supabase desactivado (variables vacías, como en CI) se
 * usan los datos de ejemplo para poder probar la interfaz.
 */
export const getProperties = cache(async (): Promise<Property[]> => {
  if (!isSupabaseConfigured) return sampleProperties;
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
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  // Un error no debe vaciar la web: al lanzarlo, Next conserva la última
  // versión publicada de la página en lugar de regenerarla sin propiedades.
  if (error) {
    console.error("No se pudieron leer las propiedades de Supabase:", error);
    throw new Error("Supabase no respondió al leer las propiedades.");
  }
  return (data as PropertyRow[])
    .map(rowToProperty)
    .filter((property) => property.images.length > 0);
});
