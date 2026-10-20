// URL del proyecto y clave pública (publishable) de Supabase. Ambas son
// públicas por diseño: la seguridad la dan las políticas de supabase/schema.sql.
// Nunca poner aquí la clave secreta (service_role / secret).
const DEFAULT_URL = "https://uowylfdlirlfqksvdeer.supabase.co";
const DEFAULT_KEY = "sb_publishable_NHbFhrEug1Zn4zkzMKVwZQ_cpB74xXZ";

// Las variables de entorno permiten usar otro proyecto. Definirlas vacías
// desactiva Supabase: el panel muestra un aviso y el catálogo queda vacío.
// Solo pruebas explícitas con THONY_TEST_FIXTURES=1 fuera de Vercel usan fixtures.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_URL;
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_KEY;

export const isSupabaseConfigured =
  (/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(supabaseUrl) ||
    (process.env.THONY_ADMIN_TESTS === "1" &&
      !process.env.VERCEL_ENV &&
      /^http:\/\/127\.0\.0\.1:\d+$/.test(supabaseUrl))) &&
  supabaseAnonKey.length > 20;

export const STORAGE_BUCKET = "properties";

export const storagePublicUrl = (path: string) =>
  path.startsWith("platform/")
    ? `/api/platform/media/${path.slice(9).split("/").map(encodeURIComponent).join("/")}`
    : `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${STORAGE_BUCKET}/${path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`;
