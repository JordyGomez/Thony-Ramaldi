import Link from "next/link";
import { signOut } from "./actions";
import styles from "./admin.module.css";

export function AdminBar({ email }: { email?: string }) {
  return (
    <header className={styles.bar}>
      <Link href="/admin" className={styles.barBrand}>
        Thony Paulino <span>Administración</span>
      </Link>
      <div className={styles.barActions}>
        <Link href="/admin">Propiedades</Link>
        <Link href="/admin/web">Mi página web</Link>
        <Link href="/admin/archivos">Archivos</Link>
        <Link href="/admin/configuracion">Configuración</Link>
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
