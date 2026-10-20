import { AccountForm } from "../account-form";
import styles from "../admin.module.css";
export default function RecoveryPage() {
  return (
    <main id="contenido" className={styles.narrow}>
      <h1>Recuperar acceso</h1>
      <p>
        Usa el correo de tu cuenta. Un enlace vencido requiere una nueva
        solicitud.
      </p>
      <AccountForm kind="recover" />
    </main>
  );
}
