import { AdminBar } from "../admin-bar";
import { requireAdmin } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MediaLibrary } from "../media-library";
import styles from "../admin.module.css";
export default async function MediaPage() {
  if (!isSupabaseConfigured) redirect("/admin");
  const { user } = await requireAdmin();
  return (
    <>
      <AdminBar email={user.email} />
      <main id="contenido" className={styles.main}>
        <div className={styles.heading}>
          <div>
            <h1>Biblioteca de archivos</h1>
            <p>
              Sube fotos y folletos para reutilizarlos en tu web y tus
              propiedades.
            </p>
          </div>
        </div>
        <MediaLibrary />
      </main>
    </>
  );
}
