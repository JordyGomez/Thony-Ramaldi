import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { isSupabaseConfigured, storagePublicUrl } from "@/lib/supabase/env";
import { getAdminUser } from "@/lib/supabase/server";
import {
  formatPrice,
  listingStatusLabel,
  listingStatus,
} from "@/data/properties";
import type { PropertyRow } from "@/data/property-row";
import { AdminBar } from "./admin-bar";
import { DeleteButton } from "./list-actions";
import styles from "./admin.module.css";

export default async function AdminPage() {
  if (!isSupabaseConfigured) return <PendingSetup />;

  const { supabase, user } = await getAdminUser();
  if (!user) redirect("/admin/login");
  const role = await supabase.rpc("is_admin");
  if (role.error || role.data !== true)
    return (
      <>
        <AdminBar email={user.email} />
        <main id="contenido" className={styles.main}>
          <div className={styles.heading}>
            <div>
              <h1>
                {role.error
                  ? "No se pudieron comprobar los permisos."
                  : "Tu cuenta necesita permisos de administración."}
              </h1>
              <p>
                {role.error
                  ? "Comprueba la conexión con Supabase y vuelve a intentarlo."
                  : `La sesión de ${user.email} es válida, pero el propietario del proyecto debe autorizar ese correo en admin_users.`}
              </p>
            </div>
          </div>
          <Link className="button" href="/admin/configuracion">
            Comprobar conexión y permisos
          </Link>
        </main>
      </>
    );
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as PropertyRow[];

  return (
    <>
      <AdminBar email={user.email} />
      <main id="contenido" className={styles.main}>
        <div className={styles.heading}>
          <div>
            <h1>Propiedades</h1>
            <p>
              {rows.length
                ? `${rows.length} en el panel · ${rows.filter((row) => row.published && !row.demo).length} publicadas en la web`
                : "Todavía no hay propiedades en el panel."}
            </p>
          </div>
          <Link href="/admin/nueva" className="button button-solid">
            <Plus size={18} aria-hidden="true" /> Nueva propiedad
          </Link>
        </div>
        {error && (
          <p className={`${styles.notice} ${styles.error}`} role="alert">
            No se pudieron cargar las propiedades. Recarga la página; si sigue
            pasando, revisa que el esquema de Supabase esté instalado.
          </p>
        )}
        {rows.length ? (
          <ul className={styles.list}>
            {rows.map((row) => {
              const status = listingStatus({
                demo: row.demo,
                inPreparation: row.in_preparation,
              });
              const cover = row.images?.[0];
              return (
                <li key={row.id} className={styles.item}>
                  <span className={styles.thumb}>
                    {cover && (
                      <Image
                        src={storagePublicUrl(cover.path)}
                        alt=""
                        fill
                        sizes="96px"
                      />
                    )}
                  </span>
                  <div>
                    <p className={styles.itemTitle}>{row.title}</p>
                    <p className={styles.itemMeta}>
                      {row.operation} · {row.type} · {row.location} · USD{" "}
                      {formatPrice(Number(row.price))}
                      {row.operation === "Alquiler" && " / mes"}
                    </p>
                    <div className={styles.tags}>
                      <span
                        className={`${styles.tag} ${status === "available" ? "" : styles.tagAccent}`}
                      >
                        {listingStatusLabel[status]}
                      </span>
                      {!row.published && (
                        <span className={`${styles.tag} ${styles.tagMuted}`}>
                          Oculta
                        </span>
                      )}
                      {row.featured && (
                        <span className={styles.tag}>Destacada</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <Link href={`/admin/${row.id}`} className="button">
                      Editar
                    </Link>
                    {row.published && !row.demo && (
                      <Link
                        href={`/propiedades/${row.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.linkButton}
                      >
                        Ver
                      </Link>
                    )}
                    <DeleteButton id={row.id} title={row.title} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          !error && (
            <div className={styles.empty}>
              <p>
                La web solo muestra las propiedades publicadas aquí, así que
                ahora mismo no aparece ninguna. Crea la primera propiedad con
                sus fotografías y datos desde el panel.
              </p>
              <div className={styles.emptyActions}>
                <Link href="/admin/nueva" className="button">
                  Crear propiedad
                </Link>
              </div>
            </div>
          )
        )}
      </main>
    </>
  );
}

function PendingSetup() {
  return (
    <>
      <AdminBar />
      <main id="contenido" className={styles.narrow}>
        <span className="label">Panel de propiedades</span>
        <h1 className={styles.pendingTitle}>Panel pendiente de activar.</h1>
        <p className={styles.pendingText}>
          El panel ya está instalado. Falta conectarlo con Supabase: crear el
          proyecto, ejecutar <code>supabase/schema.sql</code> y definir{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Mientras tanto, la web
          mantiene el catálogo vacío hasta publicar propiedades reales.
        </p>
      </main>
    </>
  );
}
