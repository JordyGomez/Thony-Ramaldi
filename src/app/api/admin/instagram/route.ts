import { getAdminUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AdminError, adminFailure, adminJson } from "@/lib/admin-access";
import { syncLatestReel } from "@/data/get-instagram-reel";

/** Estado real de la conexión con Instagram. Nunca devuelve el token. */
export async function GET() {
  try {
    if (!isSupabaseConfigured)
      throw new AdminError("Falta conectar Supabase.", 503);
    const { supabase, user } = await getAdminUser();
    if (!user) throw new AdminError("Vuelve a iniciar sesión.", 401);
    const role = await supabase.rpc("is_admin");
    if (role.error || role.data !== true)
      throw new AdminError("Tu cuenta no tiene permiso de administración.", 403);
    const sync = await syncLatestReel(true);
    return adminJson(
      sync.state === "ok"
        ? {
            state: "ok",
            permalink: sync.reel.permalink,
            publishedAt: sync.reel.publishedAt,
          }
        : sync,
    );
  } catch (error) {
    return adminFailure(error);
  }
}
