import { revalidatePath } from "next/cache";
import {
  AdminError,
  adminFailure,
  adminJson,
  checkOrigin,
  requireAdmin,
} from "@/lib/admin-access";
import { readEditorState } from "@/lib/admin-site";
import { parseSiteSettings } from "@/lib/site-settings";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const version = new URL(request.url).searchParams.get("revision");
    if (version !== null) {
      if (!/^\d+$/.test(version))
        throw new AdminError("La versión solicitada no es válida.");
      const { data, error } = await supabase
        .from("site_revisions")
        .select("content")
        .eq("revision", Number(version))
        .maybeSingle();
      if (error || !data)
        throw new AdminError("No se encontró esa versión.", 404);
      return adminJson({ ok: true, settings: parseSiteSettings(data.content) });
    }
    return adminJson({ ok: true, ...(await readEditorState(supabase)) });
  } catch (error) {
    return adminFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { supabase } = await requireAdmin();
    if (Number(request.headers.get("content-length")) > 65536)
      throw new AdminError("La configuración es demasiado grande.", 413);
    const input = await request.json();
    if (
      !Number.isSafeInteger(input.revision) ||
      input.revision < 0 ||
      typeof input.publish !== "boolean"
    )
      throw new AdminError("Recarga la versión guardada antes de continuar.");
    let settings;
    try {
      settings = parseSiteSettings(input.settings);
    } catch (error) {
      throw new AdminError(
        error instanceof Error ? error.message : "Revisa la configuración.",
      );
    }
    const { data, error } = await supabase.rpc("save_site_content", {
      p_content: settings,
      p_revision: input.revision,
      p_publish: input.publish,
    });
    if (error) {
      if (error.code === "40001")
        throw new AdminError(
          "Otra persona guardó cambios. Tu edición sigue aquí: descarga una copia y recarga la versión guardada para compararlas.",
          409,
        );
      if (["PGRST202", "PGRST205", "42883"].includes(error.code))
        throw new AdminError(
          "Falta activar el editor de la web. Abre Configuración del panel y ejecuta la migración indicada.",
          503,
        );
      throw new AdminError(
        "No se pudieron guardar los cambios. Revisa tu sesión y los permisos del editor.",
        503,
      );
    }
    if (input.publish) revalidatePath("/", "layout");
    return adminJson({
      ok: true,
      ...data,
      message: input.publish
        ? "Cambios publicados en la web."
        : "Borrador guardado. La web pública conserva su última publicación.",
    });
  } catch (error) {
    return adminFailure(error);
  }
}
