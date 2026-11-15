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

/**
 * Webhook de Kapso de tipo «meta» (carga original de Meta reenviada) para el
 * número remitente. Kapso firma con HMAC-SHA256 hexadecimal del cuerpo en
 * X-Webhook-Signature. Solo funciona con WHATSAPP_TRANSPORT=kapso y su
 * secreto configurado; en cualquier otro caso responde cerrado.
 */
export async function POST(request: Request) {
  try {
    requireAgendaWrites();
    const secret = process.env.KAPSO_WEBHOOK_SECRET;
    if (whatsappTransport() !== "kapso" || !secret || secret.length < 16)
      throw new AppointmentError("Webhook de Kapso pendiente de configurar.", 503);
    const raw = await requestText(request, 262144);
    const signature = (request.headers.get("x-webhook-signature") || "")
      .trim()
      .toLowerCase();
    const expected = createHmac("sha256", secret).update(raw).digest("hex");
    if (!/^[0-9a-f]{64}$/.test(signature) || !equalSecret(signature, expected))
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
