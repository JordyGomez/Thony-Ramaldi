import "server-only";
import {
  agendaRpc,
  appointmentClient,
  appointmentServerSecret,
} from "./access";
import { isUuid } from "./validation";

/**
 * Registra estados de entrega de WhatsApp (carga de Meta, llegue directa o
 * reenviada por Kapso). La RPC es idempotente por evento: un reintento del
 * proveedor no duplica registros ni avanza estados dos veces.
 */
export async function recordWhatsAppStatuses(body: Record<string, unknown>) {
  if (body.object !== "whatsapp_business_account") return;
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
}
