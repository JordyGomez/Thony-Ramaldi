import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicModeContent } from "@/components/public-mode";
import { getPlatformSnapshot } from "@/data/get-platform";
import { getBookingProperties } from "@/data/get-booking-properties";
import { publicAgenda } from "@/lib/appointments/public";
import { BookingWizard } from "@/components/appointments/booking-wizard";
import styles from "@/components/appointments/agenda.module.css";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  if ((await getPlatformSnapshot())?.mode === "ramaldi") notFound();
  const config = await publicAgenda();
  return {
    title: "Agenda una visita con Thony",
    description:
      "Solicita una visita o consulta inmobiliaria con Thony Paulino. Disponibilidad real y confirmación personal.",
    robots: { index: config.enabled, follow: true },
    alternates: { canonical: "/citas" },
  };
}
export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ propiedad?: string }>;
}) {
  const platform = await getPlatformSnapshot();
  if (platform?.mode === "ramaldi") notFound();
  const [config, properties, query] = await Promise.all([
    publicAgenda(),
    getBookingProperties(),
    searchParams,
  ]);
  const initial = properties.find(
    (p) => p.slug === query.propiedad || p.id === query.propiedad,
  );
  return (
    <PublicModeContent mode="thony" revision={platform?.revision || 0}>
      <main id="contenido" className={styles.page}>
        <p className={styles.eyebrow}>Tu próximo paso, con tiempo y atención</p>
        <h1 className={styles.heading}>
          Agenda una visita
          <br />
          con Thony.
        </h1>
        <p className={styles.subtitle}>
          Elige el motivo, consulta la disponibilidad y solicita tu cita. Thony
          revisará personalmente cada solicitud antes de confirmarla.
        </p>
        <div className={styles.layout}>
          <BookingWizard
            config={config}
            properties={properties}
            initialProperty={initial}
            invalidProperty={!!query.propiedad && !initial}
            siteKey={
              process.env.NEXT_PUBLIC_APPOINTMENTS_CAPTCHA_SITE_KEY || ""
            }
          />
          <aside className={styles.aside} aria-label="Información de las citas">
            <div>
              <strong>Tu horario, bien coordinado.</strong>La disponibilidad
              incluye el tiempo de la reunión y el margen necesario entre
              compromisos.
            </div>
            <div>
              <strong>Confirmación personal.</strong>Una solicitud pendiente
              conserva temporalmente el horario; todavía no es una cita
              confirmada.
            </div>
            <div>
              <strong>Hora de República Dominicana.</strong>Todas las fechas y
              horas corresponden a America/Santo_Domingo.
            </div>
            <div>
              <strong>Atención directa.</strong>
              <a href="tel:+18294045770">+1 829-404-5770</a>
              <br />
              <a href="mailto:brokerthonypaulino@ramaldigroup.com">
                brokerthonypaulino@ramaldigroup.com
              </a>
            </div>
          </aside>
        </div>
      </main>
    </PublicModeContent>
  );
}
