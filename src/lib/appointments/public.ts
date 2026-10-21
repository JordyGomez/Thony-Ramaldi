import "server-only";
import { createHmac } from "node:crypto";
import { cache } from "react";
import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  appointmentClient,
  appointmentMissing,
  appointmentServerSecret,
  agendaRpc,
} from "./access";
import {
  bookingEnvironmentReady,
  previewReadOnly,
  providerUrl,
} from "./providers";
import {
  AppointmentError,
  type PublicAgenda,
  type AppointmentKind,
} from "./types";
const unavailable: PublicAgenda = {
  installed: false,
  enabled: false,
  timezone: "America/Santo_Domingo",
  durations: {
    property_visit: 120,
    buy: 120,
    rent: 120,
    invest: 120,
    general: 120,
  },
  bufferMinutes: 30,
  holdHours: 12,
  minimumNoticeMinutes: 120,
  bookingHorizonDays: 60,
  retentionDays: 365,
  modalities: ["presencial"],
  cancellationMinutes: 120,
};
export const publicAgenda = cache(async (): Promise<PublicAgenda> => {
  await connection();
  if (!isSupabaseConfigured) return unavailable;
  const { data, error } = await appointmentClient().rpc(
    "appointment_public_config",
  );
  if (error && appointmentMissing(error.code)) return unavailable;
  if (error || !data)
    throw new AppointmentError(
      "No pudimos consultar la agenda. Reintenta dentro de un momento.",
      503,
    );
  return { ...data, enabled: data.enabled && bookingEnvironmentReady() };
});
export function requireAgendaWrites() {
  if (previewReadOnly())
    throw new AppointmentError(
      "Esta vista previa no crea reservas ni modifica datos de clientes. Utiliza la web publicada.",
      503,
    );
}
export async function rateGate(
  request: Request,
  purpose:
    | "availability"
    | "booking_ip"
    | "booking_contact"
    | "access"
    | "recover",
  contact?: string,
) {
  const secret = appointmentServerSecret();
  const ip =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const key = createHmac("sha256", secret)
    .update(purpose + ":" + (contact || ip))
    .digest("hex");
  const allowed = await agendaRpc<boolean>(
    appointmentClient(),
    "appointment_rate_gate",
    { p_secret: secret, p_key: key, p_purpose: purpose },
  );
  if (!allowed)
    throw new AppointmentError(
      "Has realizado varias solicitudes. Espera un momento antes de reintentar.",
      429,
    );
}
export async function verifyBookingCaptcha(
  token: unknown,
  request: Request,
  idempotencyKey: string,
) {
  if (typeof token !== "string" || token.length < 8 || token.length > 2048)
    throw new AppointmentError("Completa la verificación de seguridad.");
  const secret = process.env.APPOINTMENTS_TURNSTILE_SECRET;
  if (!secret || !process.env.NEXT_PUBLIC_APPOINTMENTS_CAPTCHA_SITE_KEY)
    throw new AppointmentError(
      "Las reservas en línea todavía no están activas.",
      503,
    );
  let r: Response;
  try {
    r = await fetch(providerUrl("turnstile"), {
      method: "POST",
      body: new URLSearchParams({
        secret,
        response: token,
        idempotency_key: idempotencyKey,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new AppointmentError(
      "La verificación de seguridad no respondió. Reintenta.",
      503,
    );
  }
  if (!r.ok)
    throw new AppointmentError(
      "La verificación de seguridad no está disponible.",
      503,
    );
  const data = await r.json();
  const host = (request.headers.get("host") || new URL(request.url).host).split(
    ":",
  )[0];
  if (
    data.success !== true ||
    data.action !== "appointment_request" ||
    data.hostname !== host
  )
    throw new AppointmentError(
      "La verificación de seguridad venció o no es válida. Inténtalo otra vez.",
    );
}
export function availabilityQuery(url: URL) {
  const month = url.searchParams.get("month"),
    day = url.searchParams.get("day");
  if (
    (!month && !day) ||
    (!!month && !!day) ||
    (month && !/^\d{4}-\d{2}-01$/.test(month)) ||
    (day && !/^\d{4}-\d{2}-\d{2}$/.test(day))
  )
    throw new AppointmentError("Selecciona un día o mes válido.");
  const selected = (day || month)!;
  const parsed = new Date(selected + "T12:00:00Z");
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== selected
  )
    throw new AppointmentError("Selecciona una fecha de calendario válida.");
  return { month, day };
}
export function appointmentKind(value: string | null): AppointmentKind {
  if (
    !["property_visit", "buy", "rent", "invest", "general"].includes(
      value || "",
    )
  )
    throw new AppointmentError("Tipo de cita inválido.");
  return value as AppointmentKind;
}
