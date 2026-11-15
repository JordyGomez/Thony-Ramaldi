import { createHmac } from "node:crypto";
import {
  agendaFailure,
  agendaJson,
  requestText,
} from "@/lib/appointments/access";
import { equalSecret } from "@/lib/appointments/tokens";
import { AppointmentError } from "@/lib/appointments/types";
import { object } from "@/lib/appointments/validation";
import { requireAgendaWrites } from "@/lib/appointments/public";
import { recordWhatsAppStatuses } from "@/lib/appointments/whatsapp-status";
import { whatsappTransport } from "@/lib/appointments/providers";
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
    // Con Kapso como transporte, los estados llegan por su propio webhook.
    if (whatsappTransport() !== "meta")
      throw new AppointmentError("Este webhook no está activo.", 404);
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
    await recordWhatsAppStatuses(body);
    return agendaJson({ ok: true });
  } catch (error) {
    return agendaFailure(error);
  }
}
