import type { SupabaseClient } from "@supabase/supabase-js";

// Sugerencias para el campo "Ciudad o zona": evita variantes como
// "Santiago" y "santiago " que partirían el filtro de la web en dos.
export async function knownLocations(supabase: SupabaseClient) {
  const { data } = await supabase.from("properties").select("location");
  return Array.from(
    new Set((data ?? []).map((row: { location: string }) => row.location)),
  ).sort((a, b) => a.localeCompare(b, "es"));
}
