import {
  agendaFailure,
  agendaRpc,
  appointmentClient,
  appointmentServerSecret,
} from "@/lib/appointments/access";
import { customerGrant } from "@/lib/appointments/http";
import { customerIcs } from "@/lib/appointments/calendar";
import {
  AppointmentError,
  type CustomerAppointment,
} from "@/lib/appointments/types";
import { publicAppointmentOrigin } from "@/lib/appointments/providers";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const appointment = await agendaRpc<CustomerAppointment>(
      appointmentClient(),
      "appointment_customer",
      {
        p_secret: appointmentServerSecret(),
        p_grant: await customerGrant(),
        p_action: "calendar",
        p_data: {},
      },
    );
    if (
      appointment.status !== "confirmed" &&
      !(
        appointment.baseStatus === "confirmed" &&
        ["change_proposed", "reschedule_requested"].includes(appointment.status)
      )
    )
      throw new AppointmentError(
        "Solo puedes añadir una cita confirmada al calendario.",
        409,
      );
    return new Response(
      customerIcs(appointment, new URL(publicAppointmentOrigin()).hostname),
      {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": 'attachment; filename="cita-thony.ics"',
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  } catch (error) {
    return agendaFailure(error);
  }
}
