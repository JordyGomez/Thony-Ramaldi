// URL del proyecto y clave pública (anon / publishable) de Supabase. Ambas son
// públicas por diseño: la seguridad la dan las políticas de supabase/schema.sql.
// Sin ellas, /admin muestra un aviso y la web usa src/data/properties.ts.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(supabaseUrl) &&
  supabaseAnonKey.length > 20;

export const STORAGE_BUCKET = "properties";

export const storagePublicUrl = (path: string) =>
  `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${STORAGE_BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
