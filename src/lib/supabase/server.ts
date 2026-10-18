import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

// Cliente con la sesión del administrador (cookies). Solo para /admin y sus
// acciones; las páginas públicas usan el cliente anónimo de get-properties.
export async function createAdminClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Desde un Server Component no se pueden escribir cookies; proxy.ts
          // ya renovó la sesión en esta misma petición.
        }
      },
    },
  });
}

export async function getAdminUser() {
  const supabase = await createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
