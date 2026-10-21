import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { agendaRpc, appointmentSession } from "@/lib/appointments/access";
import {
  AppointmentError,
  type AgendaWorkspace,
} from "@/lib/appointments/types";
import { integrations, previewReadOnly } from "@/lib/appointments/providers";
import { AdminBar } from "@/app/admin/admin-bar";
import styles from "./admin.module.css";
import ui from "./agenda.module.css";
export async function loadAgendaPage(
  kind: "appointments" | "leads" | "settings",
) {
  const context = await appointmentSession();
  const permission = kind === "leads" ? "leads" : "manage";
  if (!context.access.installed)
    return { ...context, data: null, readOnly: previewReadOnly() };
  if (!context.access[permission]) notFound();
  const data = await agendaRpc<AgendaWorkspace>(
    context.supabase,
    "appointment_workspace",
    { p_kind: kind },
  );
  if (kind === "leads") {
    const results = await agendaRpc<Record<string, unknown>>(
      context.supabase,
      "appointment_search_leads",
    );
    Object.assign(data, results);
  }
  if (context.access.notifications)
    data.integrations = await integrations(false);
  return { ...context, data, readOnly: previewReadOnly() };
}
export async function agendaPageContext(
  kind: "appointments" | "leads" | "settings",
) {
  try {
    return await loadAgendaPage(kind);
  } catch (e) {
    if (e instanceof AppointmentError && e.status === 401)
      redirect("/admin/login");
    throw e;
  }
}
export function AgendaSetup({ email }: { email?: string }) {
  return (
    <>
      <AdminBar email={email} />
      <main id="contenido" className={styles.main}>
        <h1>Agenda pendiente de instalación</h1>
        <p className={ui.notice}>
          El código está preparado. El propietario del proyecto Supabase debe
          instalar la migración de citas, vincular el UID verificado de Thony y
          autorizar expresamente a los técnicos. Esta pantalla no concede acceso
          a clientes ni permite crear reservas.
        </p>
        <p className={ui.muted}>
          No se han definido horarios de Thony ni se han activado envíos. La
          instalación conserva el panel, las propiedades y las dos identidades
          existentes.
        </p>
        <Link className={ui.secondary} href="/admin/configuracion">
          Volver a configuración
        </Link>
      </main>
    </>
  );
}
