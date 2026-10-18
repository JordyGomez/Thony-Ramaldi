import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { readEditorState } from "@/lib/admin-site";
import { AdminBar } from "../admin-bar";
import { SiteEditor } from "../site-editor";
import styles from "../admin.module.css";

export default async function WebsiteEditorPage() {
  if (!isSupabaseConfigured) redirect("/admin");
  const { supabase, user } = await getAdminUser();
  if (!user) redirect("/admin/login");
  const role = await supabase.rpc("is_admin");
  if (role.error || role.data !== true)
    return (
      <>
        <AdminBar email={user.email} />
        <main id="contenido" className={styles.main}>
          <h1>Permiso de administración necesario</h1>
          <p>
            Tu cuenta inició sesión, pero falta autorizar su correo en
            admin_users de Supabase. Solicita al propietario del proyecto que lo
            revise.
          </p>
        </main>
      </>
    );
  const initial = await readEditorState(supabase);
  return (
    <>
      <AdminBar email={user.email} />
      <main id="contenido" className={styles.main}>
        <div className={styles.heading}>
          <div>
            <h1>Mi página web</h1>
            <p>
              Textos, fotos, marca, secciones y experiencia. Revisa los cambios
              antes de publicarlos.
            </p>
          </div>
        </div>
        <SiteEditor initial={initial} />
      </main>
    </>
  );
}
