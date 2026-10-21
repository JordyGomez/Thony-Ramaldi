import { createHmac } from "node:crypto";
import {
  agendaFailure,
  agendaJson,
  agendaRpc,
  appointmentClient,
  appointmentServerSecret,
  requestText,
} from "@/lib/appointments/access";
import { equalSecret } from "@/lib/appointments/tokens";
import { AppointmentError } from "@/lib/appointments/types";
import { isUuid, object } from "@/lib/appointments/validation";
import { requireAgendaWrites } from "@/lib/appointments/public";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  if (
    q.get("hub.mode") === "subscribe" &&
    equalSecret(q.get("hub.verify_token"), process.env.WHATSAPP_VERIFY_TOKEN)
  ) {
    const challenge = q.get("hub.challenge") || "";
    if (/^\d{1,80}$/.test(challenge))
      return new Response(challenge, {
        headers: { "Cache-Control": "no-store" },
      });
  }
  return agendaJson({ ok: false, error: "Verificación no autorizada." }, 403);
}
export async function POST(request: Request) {
  try {
    requireAgendaWrites();
    const secret = process.env.WHATSAPP_APP_SECRET;
    if (!secret)
      throw new AppointmentError(
        "Webhook de WhatsApp pendiente de configurar.",
        503,
      );
    const raw = await requestText(request, 262144),
      signature = request.headers.get("x-hub-signature-256");
    const expected = createHmac("sha256", secret).update(raw).digest("hex");
    if (
      !signature?.startsWith("sha256=") ||
      !equalSecret(signature.slice(7), expected)
    )
      throw new AppointmentError("Firma no válida.", 401);
    let body: Record<string, unknown>;
    try {
      body = object(JSON.parse(raw));
    } catch {
      throw new AppointmentError("Evento inválido.");
    }
    if (body.object !== "whatsapp_business_account")
      return agendaJson({ ok: true });
    const entries = Array.isArray(body.entry) ? body.entry.slice(0, 50) : [];
    for (const entry of entries) {
      for (const change of Array.isArray(entry.changes)
        ? entry.changes.slice(0, 50)
        : []) {
        const value = change.value;
        if (
          value?.metadata?.phone_number_id !==
          process.env.WHATSAPP_PHONE_NUMBER_ID
        )
          continue;
        for (const s of Array.isArray(value.statuses)
          ? value.statuses.slice(0, 100)
          : []) {
          if (
            typeof s.id !== "string" ||
            s.id.length > 240 ||
            !["sent", "delivered", "read", "failed"].includes(s.status) ||
            !/^\d{10,11}$/.test(String(s.timestamp))
          )
            continue;
          const occurred = new Date(Number(s.timestamp) * 1000);
          if (!Number.isFinite(occurred.getTime())) continue;
          const opaque =
            typeof s.biz_opaque_callback_data === "string"
              ? s.biz_opaque_callback_data.split(":")
              : [];
          await agendaRpc(appointmentClient(), "appointment_delivery", {
            p_secret: appointmentServerSecret(),
            p_provider: "meta",
            p_event_id: s.id + ":" + s.status + ":" + s.timestamp,
            p_provider_id: s.id,
            p_status: s.status === "read" ? "delivered" : s.status,
            p_job: isUuid(opaque[0]) ? opaque[0] : null,
            p_claim: isUuid(opaque[1]) ? opaque[1] : null,
            p_occurred: occurred.toISOString(),
          });
        }
      }
    }
    return agendaJson({ ok: true });
  } catch (error) {
    return agendaFailure(error);
  }
}
