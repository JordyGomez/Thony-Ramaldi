"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient, getAdminUser } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import type { PropertyRow } from "@/data/property-row";
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
  const { supabase, user } = await getAdminUser();
  if (!user) return { ok: false, error: "Tu sesión terminó. Vuelve a entrar." };
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
  const { supabase, user } = await getAdminUser();
  if (!user) return { ok: false, error: "Tu sesión terminó. Vuelve a entrar." };
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
