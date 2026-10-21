import type { Metadata } from "next";
import { publicAgenda } from "@/lib/appointments/public";
import styles from "@/components/appointments/agenda.module.css";
export const metadata: Metadata = {
  title: "Privacidad de las citas · Thony Paulino",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function AppointmentPrivacy() {
  const config = await publicAgenda();
  return (
    <main id="contenido" className={`${styles.page} ${styles.privatePage}`}>
      <p className={styles.eyebrow}>Thony Paulino · Agenda privada</p>
      <h1 className={styles.heading}>Privacidad de tus citas.</h1>
      <div className={`${styles.panel} ${styles.stack}`}>
        <section>
          <h2>Datos y finalidad</h2>
          <p>
            Usamos tu nombre, teléfono, correo, interés inmobiliario y los
            comentarios que decidas proporcionar para coordinar tu cita,
            comunicar cambios y gestionar el seguimiento de tu consulta. No
            pedimos cédula ni información ajena a esta finalidad.
          </p>
        </section>
        <section>
          <h2>Acceso restringido</h2>
          <p>
            La agenda y el registro de clientes pertenecen al ámbito privado de
            Thony. Los demás asesores de Ramaldi no obtienen acceso
            automáticamente. Solo pueden consultar los datos Thony y los
            administradores técnicos expresamente autorizados.
          </p>
        </section>
        <section>
          <h2>Canales y proveedores</h2>
          <p>
            El consentimiento operativo permite gestionar la solicitud y sus
            avisos. WhatsApp requiere una autorización adicional y un canal
            habilitado. No implica aceptar publicidad. La aplicación utiliza
            Supabase y Vercel; cuando se habilitan los envíos, intervienen
            Resend para correo y Meta para WhatsApp.
          </p>
        </section>
        <section>
          <h2>Conservación y eliminación</h2>
          <p>
            {config.installed
              ? `El plazo configurado para suprimir datos de contacto y notas es de ${config.retentionDays} días sin interacción, siempre que no existan citas activas.`
              : "El plazo configurado de conservación se mostrará al activar las reservas."}{" "}
            El historial mínimo de estados se conserva sin teléfonos, correos,
            comentarios ni notas personales para mantener la trazabilidad de las
            operaciones.
          </p>
        </section>
        <section>
          <h2>Tu enlace personal</h2>
          <p>
            Los enlaces de gestión tienen alcance limitado a tu solicitud y
            caducan. No los compartas. No permiten entrar a administración ni
            consultar a otros clientes.
          </p>
        </section>
        <section>
          <h2>Contacto y derechos sobre tus datos</h2>
          <p>
            Para corregir información o solicitar su eliminación, escribe a{" "}
            <a href="mailto:brokerthonypaulino@ramaldigroup.com">
              brokerthonypaulino@ramaldigroup.com
            </a>
            . Verificaremos tu relación con la solicitud antes de realizar
            cambios. Si existe una cita activa, primero coordinaremos su
            resolución.
          </p>
        </section>
        <a className={styles.secondary} href="/citas">
          Volver a la agenda
        </a>
      </div>
    </main>
  );
}
