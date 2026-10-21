import "server-only";
import { cache } from "react";
import { getAdminUser } from "@/lib/supabase/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import { AdminError } from "@/lib/admin-access";
import { AppointmentError, type AppointmentAccess } from "./types";
export const appointmentMissing = (code: string | undefined) =>
  ["PGRST202", "PGRST205", "42P01", "42883"].includes(code || "");
export const closedAccess: AppointmentAccess = {
  installed: false,
  calendarId: null,
  manage: false,
  leads: false,
  export: false,
  permissions: false,
  notifications: false,
};
export async function readAppointmentAccess(
  client: SupabaseClient,
): Promise<AppointmentAccess> {
  const { data, error } = await client.rpc("appointment_access");
  if (error && appointmentMissing(error.code)) return closedAccess;
  if (error)
    throw new AppointmentError(
      "No se pudieron verificar los permisos privados de agenda.",
      503,
    );
  return data ?? closedAccess;
}
export const appointmentSession = cache(async () => {
  const session = await getAdminUser();
  if (!session.user)
    throw new AppointmentError("Inicia sesión para acceder a la agenda.", 401);
  return {
    ...session,
    user: session.user,
    access: await readAppointmentAccess(session.supabase),
  };
});
export async function requireAppointment(
  permission:
    | "manage"
    | "leads"
    | "export"
    | "permissions"
    | "notifications" = "manage",
) {
  const context = await appointmentSession();
  if (!context.access.installed)
    throw new AppointmentError(
      "La agenda está preparada, pero falta instalar su migración y permisos en Supabase.",
      503,
    );
  if (!context.access[permission])
    throw new AppointmentError(
      "Tu cuenta no tiene autorización para este módulo privado de Thony.",
      403,
    );
  return context;
}
export function appointmentServerSecret() {
  const secret = process.env.APPOINTMENTS_SERVER_SECRET;
  if (!secret || secret.length < 32)
    throw new AppointmentError(
      "Las reservas en línea aún no están disponibles.",
      503,
    );
  return secret;
}
export function appointmentClient() {
  if (!isSupabaseConfigured)
    throw new AppointmentError(
      "La agenda en línea aún no está disponible.",
      503,
    );
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
export async function agendaRpc<T>(
  client: SupabaseClient,
  fn: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await client.rpc(fn, args);
  if (error) {
    if (appointmentMissing(error.code))
      throw new AppointmentError(
        "La agenda está preparada, pero todavía no está instalada.",
        503,
      );
    if (error.code === "42501")
      throw new AppointmentError(
        "No tienes permiso o el enlace de acceso ya no es válido.",
        403,
      );
    if (["23P01", "23505", "40001", "55000"].includes(error.code))
      throw new AppointmentError(error.message, 409);
    if (["22023", "22P02", "22007", "23514", "23502"].includes(error.code))
      throw new AppointmentError(
        error.code === "22023"
          ? error.message
          : "Revisa los datos de la solicitud.",
        400,
      );
    if (error.code === "P0002")
      throw new AppointmentError("No se encontró el registro autorizado.", 404);
    throw new AppointmentError(
      "No se pudo completar la operación. Reintenta dentro de un momento.",
      503,
    );
  }
  return data as T;
}
export function agendaJson(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}
export function agendaFailure(error: unknown) {
  return agendaJson(
    {
      ok: false,
      error:
        error instanceof AppointmentError || error instanceof AdminError
          ? error.message
          : "No se pudo completar la operación. Reintenta dentro de un momento.",
    },
    error instanceof AppointmentError || error instanceof AdminError
      ? error.status
      : 503,
  );
}
export async function requestText(request: Request, max = 18000) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > max)
    throw new AppointmentError("La solicitud supera el tamaño permitido.", 413);
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new AppointmentError(
        "La solicitud supera el tamaño permitido.",
        413,
      );
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
export async function requestBody(request: Request, max = 18000) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new AppointmentError("Envía los datos como JSON.", 415);
  const body = await requestText(request, max);
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new AppointmentError("La solicitud no contiene datos válidos.");
  }
}
