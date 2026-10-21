import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./agenda.module.css";
export function AppointmentInvitation() {
  return (
    <section
      id="citas"
      className={styles.invitation}
      aria-labelledby="appointment-invitation-title"
    >
      <div>
        <p className={styles.eyebrow}>Una conversación con propósito</p>
        <h2 id="appointment-invitation-title">Agenda una visita con Thony</h2>
        <p>
          Reserva un espacio para conocer una propiedad o conversar sobre tu
          próximo paso inmobiliario. Cada solicitud se revisa personalmente.
        </p>
      </div>
      <Link className={styles.primary} href="/citas">
        Consultar disponibilidad <ArrowUpRight size={17} aria-hidden="true" />
      </Link>
    </section>
  );
}
