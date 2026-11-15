import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { agendaRpc, readAppointmentAccess } from "./access";
import type { AgendaWorkspace } from "./types";

export type AgendaSummary = {
  pending: number;
  upcoming: number;
  next: string | null;
  notificationErrors: number | null;
  workerError: boolean;
  leads: boolean;
};

/**
 * Resumen de citas para el dashboard. La agenda es un permiso aparte: sin
 * concesión de gestión no se consulta ningún dato y se devuelve `null`.
 */
export async function loadAgendaSummary(
  supabase: SupabaseClient,
): Promise<AgendaSummary | null> {
  try {
    const grant = await readAppointmentAccess(supabase);
    if (!grant.installed || !grant.manage) return null;
    const workspace = await agendaRpc<AgendaWorkspace>(
      supabase,
      "appointment_workspace",
      { p_kind: "appointments" },
    );
    const now = Date.now();
    const upcoming = workspace.appointments
      .filter(
        (item) =>
          item.status === "confirmed" &&
          new Date(item.starts_at).getTime() > now,
      )
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return {
      pending: workspace.appointments.filter(
        (item) => item.status === "pending",
      ).length,
      upcoming: upcoming.length,
      next: upcoming[0]?.starts_at ?? null,
      notificationErrors: workspace.notificationMetrics?.errors ?? null,
      workerError: Boolean(workspace.runtime?.lastWorkerError),
      leads: grant.leads,
    };
  } catch {
    return null;
  }
}
