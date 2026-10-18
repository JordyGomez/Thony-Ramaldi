import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAdminUser } from "@/lib/supabase/server";
import { AdminBar } from "../admin-bar";
import { PropertyForm } from "../property-form";
import { emptyPropertyInput } from "../property-input";
import { knownLocations } from "../locations";
import styles from "../admin.module.css";

export default async function NewPropertyPage() {
  if (!isSupabaseConfigured) redirect("/admin");
  const { supabase, user } = await getAdminUser();
  if (!user) redirect("/admin/login");
  return (
    <>
      <AdminBar email={user.email} />
      <main id="contenido" className={styles.main}>
        <div className={styles.heading}>
          <h1>Nueva propiedad</h1>
        </div>
        <PropertyForm
          initial={emptyPropertyInput}
          locations={await knownLocations(supabase)}
        />
      </main>
    </>
  );
}
