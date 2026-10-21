import {
  appointmentKinds,
  rdDate,
  rdTime,
  type NotificationPayload,
  type CustomerAppointment,
} from "./types";
const escape = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
const stamp = (s: string) =>
  new Date(s)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
function fold(line: string) {
  let current = "",
    bytes = 0;
  const parts: string[] = [];
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    if (bytes + size > 75) {
      parts.push(current);
      current = " " + ch;
      bytes = 1 + size;
    } else {
      current += ch;
      bytes += size;
    }
  }
  parts.push(current);
  return parts.join("\r\n");
}
export function appointmentIcs(
  input: {
    id: string;
    startsAt: string;
    endsAt: string;
    sequence: number;
    updatedAt: string;
    kind: keyof typeof appointmentKinds;
    instructions: string;
    modality: string;
  },
  host: string,
) {
  const safeHost = host.replace(/[^a-z0-9.-]/gi, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Thony Paulino//Agenda privada//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-TIMEZONE:America/Santo_Domingo",
    "BEGIN:VEVENT",
    `UID:${input.id}@${safeHost}`,
    `DTSTAMP:${stamp(input.updatedAt)}`,
    `DTSTART:${stamp(input.startsAt)}`,
    `DTEND:${stamp(input.endsAt)}`,
    `SEQUENCE:${input.sequence}`,
    "STATUS:CONFIRMED",
    `SUMMARY:${escape(appointmentKinds[input.kind] + " con Thony Paulino")}`,
    `DESCRIPTION:${escape(`${rdDate(input.startsAt)}, ${rdTime(input.startsAt)}. ${input.modality === "virtual" ? "Reunión virtual" : "Cita presencial"}. ${input.instructions}`)}`,
    `LOCATION:${escape(input.instructions)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .map(fold)
    .join("\r\n");
}
export function customerIcs(a: CustomerAppointment, host: string) {
  return appointmentIcs(a, host);
}
export function notificationIcs(
  p: NotificationPayload,
  createdAt: string,
  host: string,
) {
  return appointmentIcs(
    {
      id: p.appointmentId,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      sequence: p.sequence,
      updatedAt: createdAt,
      kind: p.kind,
      instructions: p.instructions,
      modality: p.modality,
    },
    host,
  );
}
