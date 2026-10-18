"use client";
import Link from "next/link";
import styles from "./admin.module.css";
export default function AdminErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="contenido" className={styles.main}>
      <div className={styles.heading}>
        <div>
          <h1>No se pudo abrir esta parte del panel.</h1>
          <p>
            Comprueba tu sesión y los permisos de la cuenta. Tus propiedades
            guardadas se conservan.
          </p>
        </div>
      </div>
      <div className={styles.emptyActions}>
        <button className="button" type="button" onClick={reset}>
          Reintentar
        </button>
        <Link className="button" href="/admin">
          Volver al panel
        </Link>
        <Link className="button" href="/admin/configuracion">
          Revisar conexión y permisos
        </Link>
      </div>
    </main>
  );
}
