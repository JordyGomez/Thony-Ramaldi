import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAdminUser } from "@/lib/supabase/server";
import type { PropertyRow } from "@/data/property-row";
import { AdminBar } from "../admin-bar";
import { PropertyForm } from "../property-form";
import { rowToInput } from "../property-input";
import { knownLocations } from "../locations";
import styles from "../admin.module.css";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/admin");
  const { id } = await params;
  const { supabase, user } = await getAdminUser();
  if (!user) redirect("/admin/login");
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle<PropertyRow>();
  if (!data) notFound();
  return (
    <>
      <AdminBar email={user.email} />
      <main id="contenido" className={styles.main}>
        <div className={styles.heading}>
          <div>
            <h1>Editar propiedad</h1>
            <p>{data.title}</p>
          </div>
        </div>
        <PropertyForm
          initial={rowToInput(data)}
          locations={await knownLocations(supabase)}
        />
      </main>
    </>
  );
}
