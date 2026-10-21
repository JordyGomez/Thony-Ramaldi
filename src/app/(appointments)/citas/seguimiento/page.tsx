import type { Metadata } from "next";
import { CustomerPortal } from "@/components/appointments/customer-portal";
import styles from "@/components/appointments/agenda.module.css";
export const metadata: Metadata = {
  title: "Tu solicitud de cita · Thony Paulino",
  description: "Gestión privada de tu solicitud.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function CustomerRequestPage() {
  return (
    <main id="contenido" className={`${styles.page} ${styles.privatePage}`}>
      <p className={styles.eyebrow}>Thony Paulino · Gestión privada</p>
      <h1 className={styles.heading}>Tu solicitud de cita.</h1>
      <p className={styles.subtitle}>
        Revisa el estado, responde a propuestas de horario y gestiona tu
        encuentro con Thony.
      </p>
      <CustomerPortal />
    </main>
  );
}
