import { AppointmentError, appointmentKinds, type Booking } from "./types";
export const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
    v,
  );
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AppointmentError("Revisa los datos de la solicitud.");
  return value as Record<string, unknown>;
}
export function text(value: unknown, max: number, min = 0): string {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
  )
    throw new AppointmentError("Revisa los campos del formulario.");
  return value.trim();
}
export function phone(value: unknown) {
  let normalized = text(value, 32, 8);
  if (!/^[+\d\s().-]+$/.test(normalized))
    throw new AppointmentError("Introduce un teléfono internacional válido.");
  normalized = normalized.replace(/[\s().-]/g, "");
  if (/^\d{10}$/.test(normalized) && /^(809|829|849)/.test(normalized))
    normalized = "+1" + normalized;
  else if (/^1\d{10}$/.test(normalized)) normalized = "+" + normalized;
  if (!/^\+[1-9]\d{7,14}$/.test(normalized))
    throw new AppointmentError(
      "Incluye el código de país, por ejemplo +1 829…",
    );
  return normalized;
}
export function instant(value: unknown) {
  const v = text(value, 40, 20);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(
      v,
    ) ||
    !Number.isFinite(Date.parse(v))
  )
    throw new AppointmentError("La fecha u hora no es válida.");
  return new Date(v).toISOString();
}
export function parseBooking(value: unknown): Booking {
  const data = object(value);
  const fields = [
    "name",
    "email",
    "phone",
    "kind",
    "propertyId",
    "startsAt",
    "modality",
    "comments",
    "communicationPreference",
    "operationalConsent",
    "whatsappConsent",
  ];
  if (Object.keys(data).some((k) => !fields.includes(k)))
    throw new AppointmentError("La solicitud contiene campos no permitidos.");
  const name = text(data.name, 160, 2),
    email = text(data.email, 254, 3).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AppointmentError("Introduce un correo válido.");
  const kind = text(data.kind, 40) as Booking["kind"];
  if (!Object.hasOwn(appointmentKinds, kind))
    throw new AppointmentError("Selecciona un tipo de cita.");
  if (data.modality !== "presencial" && data.modality !== "virtual")
    throw new AppointmentError("Selecciona una modalidad disponible.");
  if (data.operationalConsent !== true)
    throw new AppointmentError(
      "Necesitamos tu consentimiento para gestionar la cita.",
    );
  if (
    typeof data.whatsappConsent !== "boolean" ||
    !["email", "whatsapp", "both"].includes(
      data.communicationPreference as string,
    ) ||
    (data.communicationPreference !== "email" && !data.whatsappConsent)
  )
    throw new AppointmentError(
      "Revisa tu preferencia y autorización de WhatsApp.",
    );
  if (data.propertyId !== undefined && !isUuid(data.propertyId))
    throw new AppointmentError("Selecciona una propiedad publicada.");
  if (kind === "property_visit" && !data.propertyId)
    throw new AppointmentError("Selecciona una propiedad publicada.");
  return {
    name,
    email,
    phone: phone(data.phone),
    kind,
    modality: data.modality,
    startsAt: instant(data.startsAt),
    ...(data.propertyId ? { propertyId: data.propertyId as string } : {}),
    comments: text(data.comments ?? "", 2000),
    communicationPreference:
      data.communicationPreference as Booking["communicationPreference"],
    operationalConsent: true,
    whatsappConsent: data.whatsappConsent,
  };
}
export function csv(rows: Record<string, unknown>[]) {
  const columns = [
    "id",
    "name",
    "email",
    "phone",
    "commercialStatus",
    "interest",
    "firstContactAt",
    "lastInteractionAt",
  ];
  const cell = (value: unknown) => {
    let v = String(value ?? "").replace(/\r?\n/g, " ");
    if (/^[\s]*[=+@-]/.test(v) || /^[\t\r]/.test(v)) v = "'" + v;
    return '"' + v.replace(/"/g, '""') + '"';
  };
  return (
    "\ufeff" +
    [
      columns.map(cell).join(","),
      ...rows.map((r) => columns.map((k) => cell(r[k])).join(",")),
    ].join("\r\n")
  );
}
