import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/env";
import { properties as localProperties, type Property } from "./properties";
import { rowToProperty, type PropertyRow } from "./property-row";

// Segundos que una página puede mostrar datos anteriores si nadie la
// revalida. Guardar en /admin revalida al instante; esto es un respaldo.
export const PROPERTIES_REVALIDATE = 60;

/**
 * Fuente única de propiedades para las páginas públicas.
 * Con Supabase configurado lee las fichas publicadas; sin configuración, si
 * falla o si la tabla aún está vacía, devuelve los datos locales para que la
 * web nunca quede vacía.
 */
export const getProperties = cache(async (): Promise<Property[]> => {
  if (!isSupabaseConfigured) return localProperties;
  try {
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
    if (error) throw error;
    const mapped = (data as PropertyRow[])
      .map(rowToProperty)
      .filter((property) => property.images.length > 0);
    return mapped.length ? mapped : localProperties;
  } catch (error) {
    console.error("No se pudieron leer las propiedades de Supabase:", error);
    return localProperties;
  }
});
