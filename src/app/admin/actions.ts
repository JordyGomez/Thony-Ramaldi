"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient, getAdminUser } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { properties as localProperties } from "@/data/properties";
import type { PropertyRow, StoredImage } from "@/data/property-row";
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
  if (error)
    return { ok: false, error: "Correo o contraseña incorrectos." };
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createAdminClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveProperty(input: PropertyInput): Promise<ActionResult> {
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
      return { ok: false, error: "Ya existe otra propiedad con esa dirección web. Cámbiala." };
    console.error("saveProperty", error);
    return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo." };
  }
  // Con las políticas de seguridad, un usuario que no es administrador no
  // recibe error sino cero filas.
  if (!data)
    return { ok: false, error: "Tu cuenta no tiene permiso para publicar propiedades." };
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
  if (files.length) await supabase.storage.from(STORAGE_BUCKET).remove(files);
  refreshSite();
  return { ok: true, message: "Propiedad borrada." };
}

/**
 * Copia las propiedades que hoy están en el código (fotos y folleto incluidos)
 * a Supabase. Solo funciona con la tabla vacía, para no duplicar fichas.
 */
export async function importLocalProperties(): Promise<ActionResult> {
  const { supabase, user } = await getAdminUser();
  if (!user) return { ok: false, error: "Tu sesión terminó. Vuelve a entrar." };
  const { count } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true });
  if (count)
    return { ok: false, error: "Ya hay propiedades en el panel; no se importó nada para evitar duplicados." };

  // Los archivos locales se leen desde la propia web desplegada.
  const head = await headers();
  const origin = `${head.get("x-forwarded-proto") ?? "https"}://${head.get("host")}`;
  const upload = async (publicPath: string, target: string) => {
    const response = await fetch(new URL(publicPath, origin));
    if (!response.ok) throw new Error(`No se pudo leer ${publicPath}`);
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(target, await response.blob(), {
        contentType: response.headers.get("content-type") ?? undefined,
        upsert: true,
      });
    if (error) throw error;
    return target;
  };

  try {
    for (const [order, property] of localProperties.entries()) {
      const images: StoredImage[] = [];
      for (const [index, image] of property.images.entries()) {
        const src = typeof image.src === "string" ? image.src : image.src.src;
        const extension = src.split("?")[0].split(".").pop() || "jpg";
        images.push({
          path: await upload(src, `${property.slug}/${index + 1}.${extension}`),
          alt: image.alt,
        });
      }
      const brochurePath = property.brochure
        ? await upload(property.brochure.href, `${property.slug}/folleto.pdf`)
        : null;
      const row = inputToRow({
        title: property.title,
        slug: property.slug,
        reference: property.reference,
        location: property.location,
        neighborhood: property.neighborhood,
        type: property.type,
        operation: property.operation,
        price: property.price,
        priceProvisional: Boolean(property.priceProvisional),
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        parking: property.parking,
        description: property.description,
        amenities: property.amenities,
        images,
        featured: property.featured,
        demo: property.demo,
        inPreparation: Boolean(property.inPreparation),
        imagesAreRenders: Boolean(property.imagesAreRenders),
        projectName: property.projectName ?? "",
        projectFacts: property.projectFacts ?? [],
        projectTypologies: property.projectTypologies ?? [],
        confirmationNote: property.confirmationNote ?? "",
        brochurePath,
        brochureLabel: property.brochure?.label ?? "",
        sortOrder: order + 1,
        published: true,
      });
      const { error } = await supabase.from("properties").insert(row);
      if (error) throw error;
    }
  } catch (error) {
    console.error("importLocalProperties", error);
    return {
      ok: false,
      error: "La importación se detuvo a mitad. Revisa el panel y borra las fichas importadas antes de reintentar.",
    };
  }
  refreshSite();
  return {
    ok: true,
    message: `Se importaron ${localProperties.length} propiedades.`,
  };
}
