"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import type { PropertyRow } from "@/data/property-row";
import { requireAdmin, AdminError } from "@/lib/admin-access";
import { requirePlatform } from "@/lib/platform-access";
import {
  inputToRow,
  validatePropertyInput,
  type PropertyInput,
} from "./property-input";

export type ActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error: string };

// Toda la web pública se regenera para que el cambio se vea al instante.
const refreshSite = () => revalidatePath("/", "layout");

export async function signIn(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password)
    return { ok: false, error: "Escribe tu correo y tu contraseña." };
  const supabase = await createAdminClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: "Correo o contraseña incorrectos." };
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createAdminClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveProperty(
  input: PropertyInput,
): Promise<ActionResult> {
  if (input.scope === "enterprise") {
    try {
      const { supabase } = await requirePlatform("canWork");
      if (!input.title?.trim() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug))
        return {
          ok: false,
          error: "Completa nombre y dirección web para guardar el borrador.",
        };
      if (
        [
          input.price,
          input.bedrooms,
          input.bathrooms,
          input.area,
          input.parking,
        ].some((n) => n !== null && (!Number.isFinite(n) || n < 0))
      )
        return {
          ok: false,
          error:
            "Revisa los importes y características numéricas, o déjalos vacíos si aún no se conocen.",
        };
      if (!Number.isSafeInteger(input.version ?? 0) || (input.version ?? 0) < 0)
        return { ok: false, error: "Recarga la versión guardada." };
      const content = inputToRow(input);
      if (input.price === null) content.price_provisional = true;
      const { data, error } = await supabase.rpc("save_enterprise_property", {
        p_id: input.id || null,
        p_content: content,
        p_version: input.version ?? 0,
      });
      if (error)
        return {
          ok: false,
          error:
            error.code === "40001"
              ? "Otra sesión cambió esta ficha. Conserva tu edición y recarga."
              : error.code === "42501"
                ? "No puedes editar esta ficha o usar archivos ajenos."
                : "No se pudo guardar el borrador. Revisa los datos.",
        };
      refreshSite();
      return {
        ok: true,
        id: data,
        message: "Borrador guardado. Requiere revisión antes de publicarse.",
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof AdminError
            ? error.message
            : "No se pudo guardar el borrador.",
      };
    }
  }
  let context;
  try {
    context = await requireAdmin();
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof AdminError
          ? error.message
          : "No se pudieron verificar los permisos.",
    };
  }
  const { supabase } = context;
  const problem = validatePropertyInput(input);
  if (problem) return { ok: false, error: problem };

  const row = inputToRow(input);
  const query = input.id
    ? supabase.from("properties").update(row).eq("id", input.id)
    : supabase.from("properties").insert(row);
  const { data, error } = await query.select("id").maybeSingle();
  if (error) {
    if (error.code === "23505")
      return {
        ok: false,
        error: "Ya existe otra propiedad con esa dirección web. Cámbiala.",
      };
    console.error("saveProperty", error);
    return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo." };
  }
  // Con las políticas de seguridad, un usuario que no es administrador no
  // recibe error sino cero filas.
  if (!data)
    return {
      ok: false,
      error: "Tu cuenta no tiene permiso para publicar propiedades.",
    };
  refreshSite();
  return { ok: true, id: data.id, message: "Propiedad guardada." };
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  let context;
  try {
    context = await requireAdmin();
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof AdminError
          ? error.message
          : "No se pudieron verificar los permisos.",
    };
  }
  const { supabase } = context;
  const { data, error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .select("images, brochure_path")
    .maybeSingle<Pick<PropertyRow, "images" | "brochure_path">>();
  if (error || !data)
    return { ok: false, error: "No se pudo borrar la propiedad." };
  const files = [
    ...(data.images ?? []).map((image) => image.path),
    ...(data.brochure_path ? [data.brochure_path] : []),
  ];
  // Los archivos de la biblioteca se reutilizan en la web y otras fichas.
  // Borrar una propiedad nunca debe romper esas referencias compartidas.
  const ownedFiles = files.filter((path) => !path.startsWith("media/"));
  if (ownedFiles.length)
    await supabase.storage.from(STORAGE_BUCKET).remove(ownedFiles);
  refreshSite();
  return { ok: true, message: "Propiedad borrada." };
}
