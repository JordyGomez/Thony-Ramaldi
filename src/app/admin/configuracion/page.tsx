import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AdminBar } from "../admin-bar";
import { HealthCheck } from "./health-check";
import styles from "../admin.module.css";
export default async function ConfigurationPage() {
  if (!isSupabaseConfigured) redirect("/admin");
  const { user } = await getAdminUser();
  if (!user) redirect("/admin/login");
  return (
    <>
      <AdminBar email={user.email} />
      <main id="contenido" className={styles.main}>
        <div className={styles.heading}>
          <div>
            <h1>Configuración y conexión</h1>
            <p>
              Comprueba la sesión, los permisos y el almacenamiento de tu panel.
            </p>
          </div>
        </div>
        <HealthCheck />
        <section className={styles.setup}>
          <h2>Activar el editor completo de la web</h2>
          <p>
            Esta ampliación añade borradores privados, publicación e historial.
            Se instala una vez en el proyecto de Supabase que ya usa el panel.
          </p>
          <ol>
            <li>
              <a className={styles.linkButton} href="/api/admin/migration">
                Descargar configuración del editor
              </a>
              .
            </li>
            <li>
              En el proyecto de Supabase, abre SQL Editor, pega el contenido del
              archivo y pulsa Run.
            </li>
            <li>Vuelve aquí, comprueba la conexión y abre Mi página web.</li>
          </ol>
          <p>
            No modifica propiedades, cuentas ni fotografías existentes. Las
            fotos continúan en el almacén properties.
          </p>
        </section>
      </main>
    </>
  );
}
