import { notFound } from "next/navigation";
import { requirePlatform } from "@/lib/platform-access";
import { AdminBar } from "../admin-bar";
import { PlatformSettings } from "./settings";
import styles from "../admin.module.css";
export default async function PlatformPage() {
  const context = await requirePlatform("superadmin").catch(() => null);
  if (!context) notFound();
  const [impact, audit] = await Promise.all([
    context.supabase.rpc("platform_mode_impact", { p_target: "ramaldi" }),
    context.supabase
      .from("mode_change_audit")
      .select(
        "revision,previous_mode,new_mode,actor_id,created_at,property_count",
      )
      .order("id", { ascending: false })
      .limit(20),
  ]);
  if (impact.error || audit.error)
    throw new Error("No se pudo verificar la configuración de plataforma.");
  return (
    <>
      <AdminBar email={context.user.email} />
      <main id="contenido" className={styles.main}>
        <div className={styles.heading}>
          <div>
            <h1>Configuración avanzada de plataforma</h1>
            <p>
              Control privado de identidad, autorización y auditoría. Este
              permiso no se hereda de la administración personal.
            </p>
          </div>
        </div>
        <PlatformSettings
          initialImpact={impact.data}
          initialAudit={audit.data || []}
        />
      </main>
    </>
  );
}
