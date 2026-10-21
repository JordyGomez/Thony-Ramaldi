import "server-only";
import {
  agendaRpc,
  appointmentClient,
  appointmentServerSecret,
} from "./access";
import {
  integrations,
  previewReadOnly,
  publicAppointmentOrigin,
  sendNotification,
} from "./providers";
import { AppointmentError, type NotificationJob } from "./types";
export async function processAppointments() {
  if (previewReadOnly())
    throw new AppointmentError(
      "Los envíos automáticos están desactivados en Preview.",
      503,
    );
  const client = appointmentClient(),
    p_secret = appointmentServerSecret();
  publicAppointmentOrigin();
  const basic = await integrations(false);
  if (!basic.links)
    throw new AppointmentError(
      "Falta configurar la firma de enlaces de clientes.",
      503,
    );
  const jobs = await agendaRpc<NotificationJob[]>(
    client,
    "appointment_worker_claim",
    { p_secret, p_limit: 4 },
  );
  const health = jobs.length ? await integrations(true) : basic;
  const outcomes: string[] = [];
  for (let i = 0; i < jobs.length; i += 2)
    await Promise.all(
      jobs.slice(i, i + 2).map(async (job) => {
        const valid = await agendaRpc<boolean>(
          client,
          "appointment_worker_prepare",
          { p_secret, p_id: job.id, p_claim: job.claim_token },
        );
        if (!valid) {
          outcomes.push("cancelled");
          return;
        }
        const outcome = await sendNotification(job, health);
        await agendaRpc(client, "appointment_worker_finish", {
          p_secret,
          p_id: job.id,
          p_claim: job.claim_token,
          p_status: outcome.status,
          p_provider: outcome.provider,
          p_provider_id: outcome.providerId,
          p_error: outcome.error,
        });
        outcomes.push(outcome.status);
      }),
    );
  const anonymized = await agendaRpc<number>(
    client,
    "appointment_worker_cleanup",
    { p_secret },
  );
  return { processed: outcomes.length, outcomes, anonymized };
}
