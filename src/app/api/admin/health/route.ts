import { getAdminUser } from "@/lib/supabase/server";
import { STORAGE_BUCKET, isSupabaseConfigured } from "@/lib/supabase/env";
import { AdminError, adminFailure, adminJson } from "@/lib/admin-access";
import { storageErrorMessage } from "@/lib/media-validation";
export async function GET() {
  try {
    if (!isSupabaseConfigured)
      throw new AdminError("Falta conectar Supabase.", 503);
    const { supabase, user } = await getAdminUser();
    if (!user) throw new AdminError("Vuelve a iniciar sesión.", 401);
    const role = await supabase.rpc("is_admin");
    const checks = [
      {
        label: "Sesión",
        ok: true,
        detail: `Sesión verificada de ${user.email}.`,
      },
      {
        label: "Permisos",
        ok: !role.error && role.data === true,
        detail: role.error
          ? "No se pudo comprobar is_admin. Revisa la configuración de Supabase."
          : role.data === true
            ? "Tu cuenta tiene permiso de administración."
            : "Tu correo todavía no está autorizado en admin_users. El propietario del proyecto debe añadirlo.",
      },
    ];
    if (!role.error && role.data === true) {
      const [storage, editor] = await Promise.all([
        supabase.storage.from(STORAGE_BUCKET).list("media", { limit: 1 }),
        supabase.from("site_drafts").select("id").limit(1),
      ]);
      checks.push({
        label: "Almacenamiento de archivos",
        ok: !storage.error,
        detail: storage.error
          ? storageErrorMessage(storage.error)
          : "La biblioteca responde. Los permisos de escritura se comprueban al subir cada archivo.",
      });
      checks.push({
        label: "Editor de la web",
        ok: !editor.error,
        detail: editor.error
          ? "Falta instalar la ampliación del editor de la web. Descarga la migración y ejecútala en SQL Editor."
          : "Las tablas del editor responden.",
      });
    }
    return adminJson({ ok: true, checks });
  } catch (error) {
    return adminFailure(error);
  }
}
