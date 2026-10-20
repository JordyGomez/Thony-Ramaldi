import { notFound } from "next/navigation";
import { requirePlatform } from "@/lib/platform-access";
import type { PropertyRow } from "@/data/property-row";
import { AdminBar } from "../../../admin-bar";
import { PropertyForm } from "../../../property-form";
import { rowToInput } from "../../../property-input";
import styles from "../../../admin.module.css";
export default async function EditEnterpriseProperty({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requirePlatform("canWork").catch(() => null);
  if (!context) notFound();
  const { id } = await params;
  const { data, error } = await context.supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("organization_id", context.access.organizationId)
    .eq("agent_id", context.user.id)
    .maybeSingle<PropertyRow>();
  if (error || !data) notFound();
  return (
    <>
      <AdminBar email={context.user.email} />
      <main id="contenido" className={styles.main}>
        <h1>Editar borrador empresarial</h1>
        <PropertyForm enterprise initial={rowToInput(data)} locations={[]} />
      </main>
    </>
  );
}
