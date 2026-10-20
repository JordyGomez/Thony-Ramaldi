import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/server";
import { AccountForm } from "../account-form";
import styles from "../admin.module.css";
export default async function AccountPage() {
  const { user } = await getAdminUser();
  if (!user) redirect("/admin/login");
  return (
    <main id="contenido" className={styles.narrow}>
      <h1>Actualizar contraseña</h1>
      <AccountForm kind="password" />
    </main>
  );
}
