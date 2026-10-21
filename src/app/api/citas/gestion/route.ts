import { checkOrigin } from "@/lib/admin-access";
import {
  agendaFailure,
  agendaJson,
  agendaRpc,
  appointmentClient,
  appointmentServerSecret,
  requestBody,
} from "@/lib/appointments/access";
import { customerGrant } from "@/lib/appointments/http";
import {
  availabilityQuery,
  rateGate,
  requireAgendaWrites,
} from "@/lib/appointments/public";
import { AppointmentError } from "@/lib/appointments/types";
import { object, instant } from "@/lib/appointments/validation";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const grant = await customerGrant();
    await rateGate(request, "access");
    const url = new URL(request.url);
    if (url.searchParams.get("kind") === "availability") {
      const { month, day } = availabilityQuery(url);
      const result = await agendaRpc(
        appointmentClient(),
        "appointment_customer_availability",
        {
          p_secret: appointmentServerSecret(),
          p_grant: grant,
          p_day: day,
          p_month: month,
        },
      );
      return agendaJson({
        ok: true,
        ...(month ? { days: result } : { slots: result }),
      });
    }
    const appointment = await agendaRpc(
      appointmentClient(),
      "appointment_customer",
      {
        p_secret: appointmentServerSecret(),
        p_grant: grant,
        p_action: "read",
        p_data: {},
      },
    );
    return agendaJson({ ok: true, appointment });
  } catch (error) {
    return agendaFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    requireAgendaWrites();
    const grant = await customerGrant();
    await rateGate(request, "access");
    const input = object(await requestBody(request, 2000));
    if (
      ![
        "cancel",
        "propose",
        "accept_proposal",
        "decline_proposal",
        "preferences",
      ].includes(input.action as string) ||
      Object.keys(input).some(
        (k) =>
          ![
            "action",
            "startsAt",
            "whatsappConsent",
            "communicationPreference",
          ].includes(k),
      )
    )
      throw new AppointmentError("Acción no permitida.");
    const data =
      input.action === "propose"
        ? { startsAt: instant(input.startsAt) }
        : input.action === "preferences"
          ? {
              whatsappConsent: input.whatsappConsent,
              communicationPreference: input.communicationPreference,
            }
          : {};
    const appointment = await agendaRpc(
      appointmentClient(),
      "appointment_customer",
      {
        p_secret: appointmentServerSecret(),
        p_grant: grant,
        p_action: input.action,
        p_data: data,
      },
    );
    return agendaJson({ ok: true, appointment });
  } catch (error) {
    return agendaFailure(error);
  }
}
