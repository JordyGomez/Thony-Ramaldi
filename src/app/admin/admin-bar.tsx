import Link from "next/link";
import { appointmentSession } from "@/lib/appointments/access";
import { signOut } from "./actions";
import styles from "./admin.module.css";
import { getPlatformSession } from "@/lib/platform-access";
import { getPlatformIdentity } from "@/data/get-platform-identity";

export async function AdminBar({ email }: { email?: string }) {
  const platform = await getPlatformIdentity();
  const brand =
    platform.mode === "ramaldi" ? "Ramaldi Inmobiliaria" : "Thony Paulino";
  const context = email ? await getPlatformSession().catch(() => null) : null;
  const access = context?.access;
  const agenda = email ? await appointmentSession().catch(() => null) : null;
  const legacy = !access || access.legacyAdmin;
  return (
    <header className={styles.bar}>
      <Link href="/admin" className={styles.barBrand}>
        {brand} <span>Administración</span>
      </Link>
      <div className={styles.barActions}>
        {legacy && (
          <>
            <Link href="/admin">Propiedades</Link>
            <Link href="/admin/web">Mi página web</Link>
            <Link href="/admin/archivos">Archivos</Link>
            <Link href="/admin/configuracion">Configuración</Link>
          </>
        )}
        {agenda?.access.manage && <Link href="/admin/citas">Citas de Thony</Link>}
        {agenda?.access.leads && <Link href="/admin/clientes-potenciales">Clientes potenciales</Link>}
        {access?.installed && (access.status || access.superadmin) && (
          <Link href="/admin/empresa">
            {access.canReview
              ? "Administración empresarial"
              : access.canWork
                ? "Mi espacio profesional"
                : "Mi solicitud"}
          </Link>
        )}
        {access?.canReview && (
          <Link href="/admin/web?mode=ramaldi">Página empresarial</Link>
        )}
        {access?.superadmin && (
          <Link href="/admin/plataforma">
            Configuración avanzada de plataforma
          </Link>
        )}
        <Link href="/" target="_blank" rel="noopener noreferrer">
          Ver la web
        </Link>
        {email && (
          <form action={signOut}>
            <button type="submit" title={email}>
              Cerrar sesión
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
