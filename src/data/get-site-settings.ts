import "server-only";
import { getPlatformSnapshot } from "./get-platform";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/env";
import {
  defaultSettings,
  parseSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings";

/** Solo la publicación es pública. Borradores e historial tienen RLS privado. */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured) return defaultSettings;
  const snapshot = await getPlatformSnapshot();
  if (snapshot?.mode === "thony")
    return parseSiteSettings(snapshot.settings || {});
  // Los componentes empresariales leen su configuración independiente.
  if (snapshot?.mode === "ramaldi")
    throw new Error("Usa la configuración empresarial en esta modalidad.");
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate: 60 } }),
    },
  });
  const { data, error } = await client
    .from("site_content")
    .select("content")
    .eq("id", 1)
    .maybeSingle();
  // La migración es aditiva: la web anterior sigue funcionando hasta instalarla.
  if (error && ["PGRST205", "42P01"].includes(error.code))
    return defaultSettings;
  if (error)
    throw new Error("No se pudo leer la configuración publicada del sitio.");
  return data?.content ? parseSiteSettings(data.content) : defaultSettings;
});
