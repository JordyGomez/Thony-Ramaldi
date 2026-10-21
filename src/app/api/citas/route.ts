import { checkOrigin } from "@/lib/admin-access";
import {
  agendaFailure,
  agendaJson,
  agendaRpc,
  appointmentClient,
  appointmentServerSecret,
  requestBody,
} from "@/lib/appointments/access";
import {
  appointmentKinds,
  AppointmentError,
  type CustomerGrant,
} from "@/lib/appointments/types";
import { object, isUuid, parseBooking } from "@/lib/appointments/validation";
import {
  publicAgenda,
  rateGate,
  requireAgendaWrites,
  verifyBookingCaptcha,
} from "@/lib/appointments/public";
import { signCustomerGrant } from "@/lib/appointments/tokens";
import { setCustomerCookie } from "@/lib/appointments/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return agendaJson({
      ok: true,
      config: await publicAgenda(),
      kinds: appointmentKinds,
    });
  } catch (error) {
    return agendaFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    requireAgendaWrites();
    const input = object(await requestBody(request));
    if (
      Object.keys(input).some(
        (k) =>
          !["idempotencyKey", "booking", "captchaToken", "website"].includes(k),
      ) ||
      !isUuid(input.idempotencyKey) ||
      (input.website !== "" && input.website !== undefined)
    )
      throw new AppointmentError("Revisa los datos de la solicitud.");
    const booking = parseBooking(input.booking);
    const config = await publicAgenda();
    if (!config.enabled)
      throw new AppointmentError(
        "La agenda en línea no recibe solicitudes en este momento. Puedes contactar directamente con Thony.",
        503,
      );
    await rateGate(request, "booking_ip");
    await rateGate(
      request,
      "booking_contact",
      booking.email + "|" + booking.phone,
    );
    await verifyBookingCaptcha(
      input.captchaToken,
      request,
      input.idempotencyKey,
    );
    const result = await agendaRpc<{
      id: string;
      status: string;
      startsAt: string;
      endsAt: string;
      expiresAt: string;
      grant: CustomerGrant;
    }>(appointmentClient(), "appointment_request", {
      p_secret: appointmentServerSecret(),
      p_key: input.idempotencyKey,
      p_data: booking,
    });
    const token = signCustomerGrant(result.grant);
    const response = agendaJson(
      {
        ok: true,
        id: result.id,
        status: result.status,
        startsAt: result.startsAt,
        endsAt: result.endsAt,
        expiresAt: result.expiresAt,
        managementToken: token,
        message:
          result.status === "pending"
            ? "Tu solicitud de cita ha sido recibida correctamente. Thony revisará su disponibilidad y te notificaremos cuando la confirme."
            : "Esta solicitud ya existe. Consulta su estado actualizado con tu enlace personal.",
      },
      201,
    );
    return setCustomerCookie(response, request, token, result.grant);
  } catch (error) {
    return agendaFailure(error);
  }
}
