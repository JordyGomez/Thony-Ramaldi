import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AdminBar } from "../admin-bar";
import { LoginForm } from "./login-form";
import styles from "../admin.module.css";

export default function LoginPage() {
  if (!isSupabaseConfigured) redirect("/admin");
  return (
    <>
      <AdminBar />
      <main id="contenido" className={styles.narrow}>
        <span className="label">Panel de propiedades</span>
        <h1 className={styles.pendingTitle}>Entrar</h1>
        <LoginForm />
      </main>
    </>
  );
}
