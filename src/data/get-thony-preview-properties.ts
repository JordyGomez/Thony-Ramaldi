import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToProperty, type PropertyRow } from "./property-row";
/** La preview personal conserva su catálogo, aunque otra identidad sea pública.
 * El llamador requiere administrador personal y RLS vuelve a limitar las filas. */
export async function getThonyPreviewProperties(supabase: SupabaseClient) {
  const query = () =>
    supabase
      .from("properties")
      .select("*")
      .eq("published", true)
      .eq("demo", false)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
  let result = await query().eq("thony_visible", true);
  // Compatibilidad antes de instalar la ampliación; no hay filas empresariales.
  if (result.error?.code === "42703") result = await query();
  if (result.error)
    throw new Error(
      "No se pudo cargar el catálogo de la vista previa personal.",
    );
  return ((result.data || []) as PropertyRow[])
    .map(rowToProperty)
    .filter((p) => p.images.length > 0);
}
