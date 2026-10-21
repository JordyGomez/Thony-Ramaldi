import { Webhook } from "svix";
import {
  agendaFailure,
  agendaJson,
  agendaRpc,
  appointmentClient,
  appointmentServerSecret,
  requestText,
} from "@/lib/appointments/access";
import { AppointmentError } from "@/lib/appointments/types";
import { isUuid, object } from "@/lib/appointments/validation";
import { requireAgendaWrites } from "@/lib/appointments/public";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    requireAgendaWrites();
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret)
      throw new AppointmentError(
        "Webhook de correo pendiente de configurar.",
        503,
      );
    const raw = await requestText(request, 262144);
    let event: Record<string, unknown>;
    try {
      await new Webhook(secret).verify(raw, {
        "svix-id": request.headers.get("svix-id") || "",
        "svix-timestamp": request.headers.get("svix-timestamp") || "",
        "svix-signature": request.headers.get("svix-signature") || "",
      });
      event = object(JSON.parse(raw));
    } catch {
      throw new AppointmentError("Firma no válida.", 401);
    }
    const statuses: Record<string, string> = {
      "email.sent": "sent",
      "email.delivered": "delivered",
      "email.bounced": "failed",
      "email.failed": "failed",
      "email.complained": "failed",
    };
    const status = statuses[String(event.type)];
    if (!status) return agendaJson({ ok: true });
    const data = object(event.data);
    if (typeof data.email_id !== "string" || data.email_id.length > 240)
      throw new AppointmentError("Evento inválido.");
    let job: unknown;
    if (Array.isArray(data.tags))
      job = data.tags.find((t) => t.name === "agenda_job")?.value;
    else if (data.tags && typeof data.tags === "object")
      job = (data.tags as Record<string, unknown>).agenda_job;
    const occurred =
      typeof event.created_at === "string"
        ? new Date(event.created_at)
        : new Date();
    if (!Number.isFinite(occurred.getTime()))
      throw new AppointmentError("Fecha de evento inválida.");
    await agendaRpc(appointmentClient(), "appointment_delivery", {
      p_secret: appointmentServerSecret(),
      p_provider: "resend",
      p_event_id: request.headers.get("svix-id"),
      p_provider_id: data.email_id,
      p_status: status,
      p_job: isUuid(job) ? job : null,
      p_claim: null,
      p_occurred: occurred.toISOString(),
    });
    return agendaJson({ ok: true });
  } catch (error) {
    return agendaFailure(error);
  }
}
