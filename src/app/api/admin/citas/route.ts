import { checkOrigin } from "@/lib/admin-access";
import {
  agendaFailure,
  agendaJson,
  agendaRpc,
  requireAppointment,
  requestBody,
} from "@/lib/appointments/access";
import {
  AppointmentError,
  type AgendaWorkspace,
} from "@/lib/appointments/types";
import {
  availabilityQuery,
  appointmentKind,
  requireAgendaWrites,
} from "@/lib/appointments/public";
import { integrations, previewReadOnly } from "@/lib/appointments/providers";
import {
  object,
  text,
  isUuid,
  instant,
  csv,
} from "@/lib/appointments/validation";
import { processAppointments } from "@/lib/appointments/worker";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
function version(value: unknown) {
  if (!Number.isInteger(value) || Number(value) < 0)
    throw new AppointmentError("Revisa la versión del registro.");
  return value as number;
}
function id(value: unknown) {
  if (!isUuid(value)) throw new AppointmentError("Identificador inválido.");
  return value;
}
function exact(value: unknown, keys: string[]) {
  const data = object(value);
  if (Object.keys(data).some((k) => !keys.includes(k)))
    throw new AppointmentError("La operación contiene campos no permitidos.");
  return data;
}
export async function GET(request: Request) {
  try {
    const url = new URL(request.url),
      kind = url.searchParams.get("kind") || "appointments";
    if (url.searchParams.has("query"))
      throw new AppointmentError(
        "La búsqueda de clientes se envía por el formulario privado, sin datos personales en la URL.",
      );
    if (kind === "integrations") {
      await requireAppointment("notifications");
      return agendaJson({
        ok: true,
        integrations: await integrations(true),
        readOnly: previewReadOnly(),
      });
    }
    const { supabase, access } = await requireAppointment(
      kind === "leads" || kind === "lead" ? "leads" : "manage",
    );
    if (kind === "notifications") {
      await requireAppointment("notifications");
      return agendaJson({
        ok: true,
        ...(await agendaRpc<Record<string, unknown>>(
          supabase,
          "appointment_notification_history",
          {
            p_appointment: url.searchParams.has("appointment")
              ? id(url.searchParams.get("appointment"))
              : null,
          },
        )),
      });
    }
    if (kind === "appointment")
      return agendaJson({
        ok: true,
        appointment: await agendaRpc(supabase, "appointment_detail", {
          p_id: id(url.searchParams.get("id")),
        }),
      });
    if (kind === "calendar")
      return agendaJson({
        ok: true,
        appointments: await agendaRpc(supabase, "appointment_calendar", {
          p_from: instant(url.searchParams.get("from")),
          p_until: instant(url.searchParams.get("until")),
        }),
      });
    if (kind === "lead")
      return agendaJson({
        ok: true,
        ...(await agendaRpc<Record<string, unknown>>(
          supabase,
          "appointment_lead_detail",
          {
            p_id: id(url.searchParams.get("id")),
            p_page: Number(url.searchParams.get("page") || 0),
          },
        )),
      });
    if (kind === "availability") {
      const { day, month } = availabilityQuery(url);
      const appointment = url.searchParams.get("appointment");
      if (appointment) id(appointment);
      const type = appointmentKind(url.searchParams.get("type") || "general");
      const modality = url.searchParams.get("modality") || "presencial";
      if (!["presencial", "virtual"].includes(modality))
        throw new AppointmentError("Modalidad inválida.");
      const result = await agendaRpc(
        supabase,
        month ? "appointment_public_month" : "appointment_admin_slots",
        month
          ? {
              p_month: month,
              p_kind: type,
              p_modality: modality,
              p_appointment: appointment,
            }
          : {
              p_day: day,
              p_id: appointment,
              p_kind: type,
              p_modality: modality,
            },
      );
      return agendaJson({
        ok: true,
        ...(month ? { days: result } : { slots: result }),
      });
    }
    if (!["appointments", "leads", "settings"].includes(kind))
      throw new AppointmentError("Consulta no permitida.");
    const args: Record<string, unknown> = {
      p_kind: kind,
      p_page: Number(url.searchParams.get("page") || 0),
    };
    if (url.searchParams.has("from"))
      args.p_from = instant(url.searchParams.get("from"));
    if (url.searchParams.has("until"))
      args.p_until = instant(url.searchParams.get("until"));
    let data = await agendaRpc<AgendaWorkspace>(
      supabase,
      "appointment_workspace",
      args,
    );
    if (kind === "leads") {
      const filter: Record<string, unknown> = {
        p_query: (url.searchParams.get("query") || "").slice(0, 160),
        p_status: url.searchParams.get("status") || null,
        p_sort: url.searchParams.get("sort") || "newest",
        p_page: Number(url.searchParams.get("page") || 0),
        p_property: url.searchParams.has("property")
          ? id(url.searchParams.get("property"))
          : null,
      };
      if (url.searchParams.has("from")) filter.p_from = args.p_from;
      if (url.searchParams.has("until")) filter.p_until = args.p_until;
      data = {
        ...data,
        ...(await agendaRpc<Record<string, unknown>>(
          supabase,
          "appointment_search_leads",
          filter,
        )),
      };
    }
    return agendaJson({
      ok: true,
      ...data,
      readOnly: previewReadOnly(),
      ...(access.notifications
        ? { integrations: await integrations(false) }
        : {}),
    });
  } catch (error) {
    return agendaFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const input = exact(await requestBody(request, 18000), [
      "action",
      "id",
      "operation",
      "data",
      "expected",
      "permissions",
      "revoke",
      "userId",
      "filters",
    ]);
    const action = input.action;
    if (action === "search_leads") {
      const { supabase } = await requireAppointment("leads");
      const filters = exact(input.filters ?? {}, [
        "query",
        "status",
        "from",
        "until",
        "property",
        "sort",
        "page",
      ]);
      const args: Record<string, unknown> = {
        p_query: text(filters.query ?? "", 160),
        p_status: filters.status || null,
        p_sort: filters.sort || "newest",
        p_page: version(filters.page ?? 0),
        p_property: filters.property ? id(filters.property) : null,
      };
      if (filters.from) args.p_from = instant(filters.from);
      if (filters.until) args.p_until = instant(filters.until);
      return agendaJson({
        ok: true,
        ...(await agendaRpc<Record<string, unknown>>(
          supabase,
          "appointment_search_leads",
          args,
        )),
      });
    }
    requireAgendaWrites();
    if (action === "export") {
      const { supabase } = await requireAppointment("export");
      const rows = await agendaRpc<Record<string, unknown>[]>(
        supabase,
        "appointment_export",
      );
      return new Response(csv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="clientes-thony.csv"',
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
    if (action === "process") {
      const context = await requireAppointment("manage");
      await requireAppointment("notifications");
      await agendaRpc(context.supabase, "appointment_unblock_notifications");
      return agendaJson({ ok: true, ...(await processAppointments()) });
    }
    if (action === "grant") {
      const { supabase } = await requireAppointment("permissions");
      const permissions = exact(input.permissions ?? {}, [
        "manage",
        "leads",
        "export",
        "permissions",
        "notifications",
      ]);
      if (
        Object.values(permissions).some((v) => typeof v !== "boolean") ||
        typeof input.revoke !== "boolean"
      )
        throw new AppointmentError("Permisos inválidos.");
      await agendaRpc(supabase, "appointment_grant_action", {
        p_user: id(input.userId),
        p_revoke: input.revoke,
        p_permissions: permissions,
      });
      return agendaJson({ ok: true });
    }
    if (action === "lead") {
      const { supabase } = await requireAppointment("leads");
      const operation = text(input.operation, 40);
      const keys: Record<string, string[]> = {
        status: ["status"],
        note: ["body"],
        task: ["title", "dueAt"],
        task_status: ["id", "status"],
        link_appointment: ["appointmentId", "targetLeadId"],
        anonymize: ["confirmation"],
      };
      if (!keys[operation])
        throw new AppointmentError("Acción de cliente no permitida.");
      const data = exact(input.data, keys[operation]);
      if (operation === "note") data.body = text(data.body, 4000, 1);
      if (operation === "task") {
        data.title = text(data.title, 240, 2);
        data.dueAt = instant(data.dueAt);
      }
      if (operation === "task_status") id(data.id);
      if (operation === "link_appointment") {
        id(data.appointmentId);
        id(data.targetLeadId);
      }
      await agendaRpc(supabase, "appointment_lead_action", {
        p_id: id(input.id),
        p_action: operation,
        p_data: data,
        p_expected: version(input.expected),
      });
      return agendaJson({ ok: true });
    }
    const { supabase } = await requireAppointment("manage");
    if (action === "configure") {
      const operation = text(input.operation, 40);
      if (
        ![
          "settings",
          "rule_save",
          "rule_remove",
          "blackout_save",
          "blackout_remove",
        ].includes(operation)
      )
        throw new AppointmentError("Configuración no permitida.");
      const result = await agendaRpc<Record<string, unknown>>(
        supabase,
        "appointment_configure",
        {
          p_action: operation,
          p_data: object(input.data),
          p_expected: version(input.expected),
        },
      );
      return agendaJson({ ok: true, ...result });
    }
    if (action === "appointment") {
      const operation = text(input.operation, 40);
      if (
        ![
          "confirm",
          "reject",
          "cancel",
          "complete",
          "no_show",
          "note",
          "propose",
          "accept_proposal",
          "decline_proposal",
        ].includes(operation)
      )
        throw new AppointmentError("Acción no permitida.");
      const data = exact(input.data ?? {}, [
        "note",
        "instructions",
        "startsAt",
      ]);
      if (data.note !== undefined) data.note = text(data.note, 2000);
      if (data.instructions !== undefined)
        data.instructions = text(data.instructions, 1500);
      if (data.startsAt !== undefined) data.startsAt = instant(data.startsAt);
      const result = await agendaRpc<Record<string, unknown>>(
        supabase,
        "appointment_admin_action",
        {
          p_id: id(input.id),
          p_action: operation,
          p_expected: version(input.expected),
          p_data: data,
        },
      );
      return agendaJson({ ok: true, ...result });
    }
    throw new AppointmentError("Acción no permitida.");
  } catch (error) {
    return agendaFailure(error);
  }
}
