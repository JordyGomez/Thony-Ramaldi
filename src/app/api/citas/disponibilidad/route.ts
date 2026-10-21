import {
  agendaFailure,
  agendaJson,
  agendaRpc,
  appointmentClient,
  appointmentServerSecret,
} from "@/lib/appointments/access";
import {
  appointmentKind,
  availabilityQuery,
  publicAgenda,
  rateGate,
} from "@/lib/appointments/public";
import { AppointmentError } from "@/lib/appointments/types";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const url = new URL(request.url),
      { month, day } = availabilityQuery(url);
    const kind = appointmentKind(url.searchParams.get("type"));
    const modality = url.searchParams.get("modality") || "presencial";
    if (!["presencial", "virtual"].includes(modality))
      throw new AppointmentError("Modalidad inválida.");
    const config = await publicAgenda();
    if (!config.enabled)
      return agendaJson({ ok: true, enabled: false, days: [], slots: [] });
    await rateGate(request, "availability");
    const data = await agendaRpc(
      appointmentClient(),
      "appointment_public_availability",
      {
        p_secret: appointmentServerSecret(),
        p_kind: kind,
        p_modality: modality,
        p_day: day,
        p_month: month,
      },
    );
    return agendaJson({
      ok: true,
      enabled: true,
      ...(month ? { days: data } : { slots: data }),
    });
  } catch (error) {
    return agendaFailure(error);
  }
}
