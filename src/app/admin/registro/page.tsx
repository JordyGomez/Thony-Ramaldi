import { notFound } from "next/navigation";
import { getPlatformSnapshot } from "@/data/get-platform";
import { AccountForm } from "../account-form";
import styles from "../admin.module.css";
export default async function RegistrationPage() {
  const platform = await getPlatformSnapshot();
  if (platform?.mode !== "ramaldi" || !platform.registrationEnabled) notFound();
  return (
    <main id="contenido" className={styles.narrow}>
      <h1>Incorporación con invitación</h1>
      <AccountForm kind="signup" />
    </main>
  );
}
