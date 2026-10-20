import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminUser } from "@/lib/supabase/server";
import { AdminError } from "@/lib/admin-access";
import { platformMissing, type PlatformAccess } from "./platform";

export async function readPlatformAccess(
  supabase: SupabaseClient,
): Promise<PlatformAccess> {
  const { data, error } = await supabase.rpc("platform_access");
  if (error && !platformMissing(error.code))
    throw new AdminError(
      "No se pudieron verificar los permisos de plataforma.",
      503,
    );
  if (!error && data) return { ...data, installed: true };
  const legacy = await supabase.rpc("is_admin");
  if (legacy.error)
    throw new AdminError("No se pudieron comprobar los permisos.", 503);
  return {
    installed: false,
    superadmin: false,
    legacyAdmin: legacy.data === true,
    organizationId: null,
    role: null,
    status: null,
    revision: 0,
    reviewerNote: "",
    verified: false,
    enabled: false,
    canReview: false,
    canWork: false,
  };
}
export const getPlatformSession = cache(async () => {
  const session = await getAdminUser();
  if (!session.user) throw new AdminError("Inicia sesión para continuar.", 401);
  return {
    ...session,
    user: session.user,
    access: await readPlatformAccess(session.supabase),
  };
});
export async function requirePlatform(
  permission: "superadmin" | "canReview" | "canWork" | "session",
) {
  const context = await getPlatformSession();
  if (!context.access.installed)
    throw new AdminError(
      "La ampliación empresarial está preparada, pero no está instalada en esta base de datos.",
      503,
    );
  if (permission !== "session" && !context.access[permission])
    throw new AdminError(
      "Tu cuenta no tiene permiso para esta operación.",
      403,
    );
  return context;
}
