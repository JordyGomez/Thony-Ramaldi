import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-access";
import { AdminBar } from "../admin-bar";
import { EnterpriseWorkspace } from "./workspace";
import styles from "../admin.module.css";
export default async function EnterprisePage() {
  const context = await getPlatformSession().catch(() => null);
  if (!context) redirect("/admin/login");
  return (
    <>
      <AdminBar email={context.user.email} />
      <main id="contenido" className={styles.main}>
        <div className={styles.heading}>
          <div>
            <h1>
              {context.access.canReview
                ? "Administración empresarial"
                : context.access.canWork
                  ? "Mi espacio profesional"
                  : "Mi solicitud"}
            </h1>
            <p>
              La aprobación de una cuenta, un perfil y una propiedad son
              procesos separados.
            </p>
          </div>
        </div>
        {context.access.installed ? (
          <EnterpriseWorkspace
            access={context.access}
            userId={context.user.id}
          />
        ) : (
          <p className={styles.notice}>
            La ampliación empresarial está preparada, pero requiere la
            instalación revisada de sus migraciones. El panel personal se
            conserva.
          </p>
        )}
      </main>
    </>
  );
}
