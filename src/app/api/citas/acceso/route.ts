import { checkOrigin } from "@/lib/admin-access";
import {
  agendaFailure,
  agendaJson,
  agendaRpc,
  appointmentClient,
  appointmentServerSecret,
  requestBody,
} from "@/lib/appointments/access";
import { setCustomerCookie } from "@/lib/appointments/http";
import { rateGate } from "@/lib/appointments/public";
import { verifyCustomerGrant } from "@/lib/appointments/tokens";
import { object, text } from "@/lib/appointments/validation";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await rateGate(request, "access");
    const input = object(await requestBody(request, 1500));
    const token = text(input.token, 800, 20),
      grant = verifyCustomerGrant(token);
    await agendaRpc(appointmentClient(), "appointment_customer", {
      p_secret: appointmentServerSecret(),
      p_grant: grant,
      p_action: "read",
      p_data: {},
    });
    return setCustomerCookie(agendaJson({ ok: true }), request, token, grant);
  } catch (error) {
    return agendaFailure(error);
  }
}
