import { redirect } from "next/navigation";
import { requirePlatform } from "@/lib/platform-access";
import { AdminBar } from "../../admin-bar";
import { PropertyForm } from "../../property-form";
import { emptyPropertyInput } from "../../property-input";
import styles from "../../admin.module.css";
export default async function NewEnterpriseProperty() {
  const context = await requirePlatform("canWork").catch(() => null);
  if (!context || context.access.status !== "active")
    redirect("/admin/empresa");
  return (
    <>
      <AdminBar email={context.user.email} />
      <main id="contenido" className={styles.main}>
        <h1>Nueva propiedad empresarial</h1>
        <PropertyForm
          enterprise
          initial={{
            ...emptyPropertyInput,
            scope: "enterprise",
            version: 0,
            published: false,
            priceProvisional: true,
          }}
          locations={[]}
        />
      </main>
    </>
  );
}
