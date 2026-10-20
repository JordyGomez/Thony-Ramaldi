import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { readEditorState } from "@/lib/admin-site";
import { AdminBar } from "../admin-bar";
import { SiteEditor } from "../site-editor";
import styles from "../admin.module.css";
import { readPlatformAccess } from "@/lib/platform-access";
import { readCorporateEditor } from "@/lib/platform-editor";
import { CorporateSiteEditor } from "../corporate-site-editor";

export default async function WebsiteEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/admin");
  const { supabase, user } = await getAdminUser();
  if (!user) redirect("/admin/login");
  const access = await readPlatformAccess(supabase);
  const mode = (await searchParams).mode;
  if (mode && !["thony", "ramaldi"].includes(mode)) notFound();
  if (!mode && access.canReview && !access.legacyAdmin)
    redirect("/admin/web?mode=ramaldi");
  if (mode === "ramaldi") {
    if (!access.canReview) notFound();
    const initial = await readCorporateEditor(supabase);
    return (
      <>
        <AdminBar email={user.email} />
        <main id="contenido" className={styles.main}>
          <div className={styles.heading}>
            <div>
              <h1>Mi página web · Ramaldi</h1>
              <p>
                Identidad empresarial independiente. Guardar o publicar esta
                configuración no activa el portal.
              </p>
            </div>
          </div>
          {access.legacyAdmin && (
            <Link className="button" href="/admin/web?mode=thony">
              Editar identidad de Thony
            </Link>
          )}
          <CorporateSiteEditor
            initial={initial}
            superadmin={access.superadmin}
          />
        </main>
      </>
    );
  }
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
        {access.canReview && (
          <Link className="button" href="/admin/web?mode=ramaldi">
            Editar identidad de Ramaldi
          </Link>
        )}
        <SiteEditor initial={initial} />
      </main>
    </>
  );
}
