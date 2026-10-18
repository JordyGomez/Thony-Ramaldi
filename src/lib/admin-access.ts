import "server-only";
import { getAdminUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export class AdminError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function requireAdmin() {
  if (!isSupabaseConfigured)
    throw new AdminError(
      "El panel todavía no está conectado con Supabase.",
      503,
    );
  const { supabase, user } = await getAdminUser();
  if (!user)
    throw new AdminError(
      "Tu sesión terminó. Vuelve a entrar al panel y reintenta la subida.",
      401,
    );
  const { data, error } = await supabase.rpc("is_admin");
  if (error)
    throw new AdminError(
      "No se pudieron comprobar los permisos. Revisa la configuración de administradores en Supabase.",
      503,
    );
  if (data !== true)
    throw new AdminError(
      "Tu cuenta inició sesión, pero no tiene permiso de administrador. Añade su correo en admin_users de Supabase.",
      403,
    );
  return { supabase, user };
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  let originHost = "";
  try {
    originHost = origin ? new URL(origin).host : "";
  } catch {
    /* Origen inválido. */
  }
  // Next puede construir request.url con su host interno al estar tras un proxy.
  // Host es el destino que recibió la petición; un navegador no puede falsificarlo.
  const destination = request.headers.get("host") || new URL(request.url).host;
  if (!originHost || originHost !== destination)
    throw new AdminError(
      "Esta operación debe hacerse desde el panel de la web.",
      403,
    );
}
export function adminJson(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function adminFailure(error: unknown) {
  return adminJson(
    {
      ok: false,
      error:
        error instanceof AdminError
          ? error.message
          : "El servidor no pudo completar la operación. Reintenta dentro de un momento.",
    },
    error instanceof AdminError ? error.status : 503,
  );
}
