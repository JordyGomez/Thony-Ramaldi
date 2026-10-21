import {
  appointmentKinds,
  appointmentStatuses,
  notificationTitles,
  rdDate,
  rdTime,
  type NotificationJob,
} from "./types";
import { notificationIcs } from "./calendar";
const html = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ]!,
  );
export function notificationText(job: NotificationJob) {
  const p = job.payload;
  switch (job.event) {
    case "received":
      return "Hemos recibido correctamente tu solicitud de cita con Thony Paulino. La fecha y hora están pendientes de confirmación. Te notificaremos cuando Thony la revise.";
    case "confirmed":
      return "Nos complace informarte que tu cita con Thony Paulino ha sido confirmada. Revisa los detalles e instrucciones antes de asistir.";
    case "rejected":
      return "Thony no puede atender esta solicitud en el horario indicado. Puedes consultar la disponibilidad y solicitar otra fecha. Gracias por tu comprensión.";
    case "proposal":
      return "Hay una nueva propuesta de horario que requiere la aceptación de la otra parte. Una cita confirmada anterior conserva su reserva hasta aceptar el cambio. Revisa la propuesta antes de su vencimiento.";
    case "rescheduled":
      return "La nueva fecha ha sido aceptada y tu cita quedó reprogramada. Los recordatorios anteriores fueron reemplazados por los de este horario.";
    case "cancelled_client":
    case "cancelled_thony":
      return "La cita fue cancelada y el horario quedó liberado. Si lo deseas, puedes solicitar una nueva fecha.";
    case "expired":
      return "El plazo para confirmar esta solicitud venció y su reserva provisional quedó liberada. Puedes solicitar otra fecha disponible.";
    case "proposal_expired":
      return "La propuesta de cambio ya no está vigente. Consulta el estado de tu solicitud; una cita que ya estaba confirmada conserva su horario original.";
    case "proposal_declined":
      return "La propuesta de cambio no fue aceptada. Revisa el estado y el horario vigente de tu solicitud.";
    case "reminder_24h":
    case "reminder_day":
      return `Te recordamos tu cita del ${rdDate(p.startsAt)}, a las ${rdTime(p.startsAt)}, con Thony Paulino. Revisa la modalidad y las instrucciones confirmadas.`;
    case "completed":
      return "Gracias por reunirte con Thony Paulino. Puedes contactarnos si necesitas continuar con tu consulta inmobiliaria.";
    case "no_show":
      return "No pudimos completar el encuentro previsto. Puedes contactar a Thony para coordinar una nueva fecha.";
    default:
      return "Hay una actualización de tu solicitud de cita. Consulta su estado de forma segura.";
  }
}
export function buildNotification(
  job: NotificationJob,
  managementLink: string,
  origin: string,
) {
  const p = job.payload,
    title = notificationTitles[job.event] ?? "Actualización de cita";
  const duration = Math.round(
    (Date.parse(p.endsAt) - Date.parse(p.startsAt)) / 60000,
  );
  const owner = job.recipient === "owner";
  const subject = owner
    ? `${job.event === "received" ? "Nueva solicitud de cita" : title} — Thony Ramaldi`
    : title + " · Thony Paulino";
  const fields = [
    ["Tipo", appointmentKinds[p.kind]],
    ["Fecha", rdDate(p.startsAt)],
    ["Hora", rdTime(p.startsAt) + " · República Dominicana"],
    ["Duración", duration + " minutos"],
    ["Modalidad", p.modality === "virtual" ? "Virtual" : "Presencial"],
    [
      "Propiedad",
      p.property
        ? `${p.property.reference} · ${p.property.title}`
        : "Consulta sin propiedad asociada",
    ],
    ["Estado", appointmentStatuses[p.status] ?? p.status],
    ...(p.instructions ? [["Lugar o instrucciones", p.instructions]] : []),
    ...(owner
      ? [
          ["Cliente", p.name],
          ["Teléfono", p.phone],
          ["Correo", p.email],
          ...(p.comments ? [["Comentarios", p.comments]] : []),
        ]
      : []),
  ];
  const plain = [
    title,
    owner ? "Solicitud de " + p.name : "Hola, " + p.name + ".",
    notificationText(job),
    ...fields.map(([label, value]) => label + ": " + value),
    "Revisar solicitud: " + managementLink,
    "Thony Paulino · Asesor inmobiliario · Ramaldi",
    p.ownerEmail,
    p.ownerWhatsapp,
    "Mensajes operativos de citas. No publicidad.",
  ].join("\n\n");
  const rows = fields
    .map(
      ([label, value]) =>
        `<tr><th style="padding:11px 12px;text-align:left;vertical-align:top;color:#59615e;font-size:13px;font-weight:500;border-bottom:1px solid #e7ebe9;width:31%">${html(label)}</th><td style="padding:11px 12px;text-align:left;color:#202522;font-size:14px;border-bottom:1px solid #e7ebe9;overflow-wrap:anywhere">${html(value)}</td></tr>`,
    )
    .join("");
  const emailHtml = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px 12px;background:#f3f5f4;font-family:Arial,sans-serif;color:#202522"><div style="max-width:620px;margin:0 auto;background:white;border:1px solid #e0e5e2"><header style="background:#202522;padding:28px;color:#fff"><p style="margin:0 0 8px;letter-spacing:2px;font-size:12px;color:#dac589">THONY PAULINO · RAMALDI</p><h1 style="margin:0;font-size:25px;line-height:1.3;font-weight:500">${html(title)}</h1></header><main style="padding:28px"><p style="font-size:16px">${owner ? "Solicitud de " + html(p.name) : "Hola, " + html(p.name) + "."}</p><p style="font-size:15px;line-height:1.7">${html(notificationText(job))}</p><table role="presentation" style="border-collapse:collapse;width:100%;margin:24px 0">${rows}</table><a href="${html(managementLink)}" style="display:inline-block;background:#24564c;color:white;padding:14px 20px;text-decoration:none;font-size:15px">${owner ? "Revisar en administración" : "Gestionar mi solicitud"}</a><p style="font-size:12px;line-height:1.7;color:#59615e;margin-top:20px">${owner ? "Este enlace requiere tu sesión y permiso privado de agenda." : "Este enlace es personal y tiene una vigencia limitada. No lo compartas."}</p></main><footer style="padding:22px 28px;background:#f8f9f8;color:#59615e;font-size:12px;line-height:1.8">Thony Paulino<br>Asesor inmobiliario · Ramaldi<br>${html(p.ownerEmail)} · ${html(p.ownerWhatsapp)}<br>Mensajes operativos de citas. No publicidad.</footer></div></body></html>`;
  const attachments = ["confirmed", "rescheduled"].includes(job.event)
    ? [
        {
          filename: "cita-thony.ics",
          content: Buffer.from(
            notificationIcs(p, job.created_at, new URL(origin).hostname),
          ).toString("base64"),
          content_type: "text/calendar; charset=utf-8",
        },
      ]
    : [];
  const whatsappParameters = [
    title,
    p.name,
    p.phone,
    p.email,
    appointmentKinds[p.kind],
    p.property
      ? `${p.property.reference} · ${p.property.title}`
      : "Consulta general",
    rdDate(p.startsAt),
    rdTime(p.startsAt),
    duration + " minutos",
    p.modality === "virtual" ? "Virtual" : "Presencial",
    appointmentStatuses[p.status] ?? p.status,
    owner
      ? p.comments.slice(0, 500) || "Sin comentarios"
      : "Revisa las instrucciones en tu enlace personal",
    managementLink,
  ];
  return {
    subject,
    text: plain,
    html: emailHtml,
    attachments,
    whatsappParameters,
  };
}
