import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/supabase/server";
import { requireAdmin, AdminError } from "@/lib/admin-access";
import { AdminBar } from "@/app/admin/admin-bar";
import { knownLocations } from "@/app/admin/locations";
import {
  TREO_SLUG,
  treoAssets,
  treoPropertyInput,
  treoUnits,
} from "@/data/treo-ii";
import { TreoSetup } from "./setup";
import styles from "@/components/project/project.module.css";
export const metadata = {
  title: "Preparar TREO II · Administración",
  robots: { index: false, follow: false },
};
export default async function TreoSetupPage() {
  const session = await getAdminUser();
  if (!session.user) redirect("/admin/login");
  let context;
  try {
    context = await requireAdmin();
  } catch (e) {
    if (e instanceof AdminError && e.status === 403) notFound();
    throw e;
  }
  const { data, error } = await context.supabase
    .from("properties")
    .select("id")
    .eq("slug", TREO_SLUG)
    .maybeSingle();
  if (error)
    throw new Error(
      "No se pudo comprobar si la ficha ya existe. Recarga antes de continuar.",
    );
  return (
    <>
      <AdminBar email={context.user.email} />
      {data ? (
        <main id="contenido" className={styles.setup}>
          <h1>TREO II ya está en el panel</h1>
          <p>
            La ficha existente se conserva. No se repite la preparación ni se
            reemplazan sus imágenes o precios.
          </p>
          <Link className={styles.primary} href={"/admin/" + data.id}>
            Editar ficha existente
          </Link>
        </main>
      ) : (
        <TreoSetup
          locations={await knownLocations(context.supabase)}
          readOnly={process.env.VERCEL_ENV === "preview"}
          seed={treoPropertyInput()}
          assets={treoAssets}
          units={treoUnits}
        />
      )}
    </>
  );
}
