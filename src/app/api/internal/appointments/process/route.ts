import { agendaFailure, agendaJson } from "@/lib/appointments/access";
import { equalSecret } from "@/lib/appointments/tokens";
import { AppointmentError } from "@/lib/appointments/types";
import { processAppointments } from "@/lib/appointments/worker";
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization");
    if (
      !equalSecret(
        auth?.startsWith("Bearer ") ? auth.slice(7) : null,
        process.env.APPOINTMENTS_SERVER_SECRET,
      )
    )
      throw new AppointmentError("No autorizado.", 401);
    return agendaJson({ ok: true, ...(await processAppointments()) });
  } catch (error) {
    return agendaFailure(error);
  }
}
