import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { AppointmentError, type CustomerGrant } from "./types";
import { isUuid } from "./validation";
export function linkSecret() {
  const value = process.env.APPOINTMENTS_LINK_SIGNING_SECRET;
  if (!value || value.length < 32)
    throw new AppointmentError(
      "La gestión segura de citas aún no está disponible.",
      503,
    );
  return value;
}
function signature(payload: string) {
  return createHmac("sha256", linkSecret())
    .update("thony-appointment-access-v1." + payload)
    .digest();
}
export function signCustomerGrant(grant: CustomerGrant) {
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      id: grant.id,
      nonce: grant.nonce,
      expiresAt: grant.expiresAt,
    }),
  ).toString("base64url");
  return payload + "." + signature(payload).toString("base64url");
}
export function verifyCustomerGrant(token: string): CustomerGrant {
  if (token.length > 800)
    throw new AppointmentError("El enlace no es válido o venció.", 401);
  const [payload, mac, ...extra] = token.split(".");
  if (!payload || !mac || extra.length)
    throw new AppointmentError("El enlace no es válido o venció.", 401);
  const supplied = Buffer.from(mac, "base64url"),
    expected = signature(payload);
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    throw new AppointmentError("El enlace no es válido o venció.", 401);
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new AppointmentError("El enlace no es válido o venció.", 401);
  }
  if (
    !data ||
    data.v !== 1 ||
    !isUuid(data.id) ||
    !isUuid(data.nonce) ||
    !Number.isInteger(data.expiresAt) ||
    data.expiresAt <= Math.floor(Date.now() / 1000) ||
    Object.keys(data).some(
      (k) => !["v", "id", "nonce", "expiresAt"].includes(k),
    )
  )
    throw new AppointmentError("El enlace no es válido o venció.", 401);
  return { id: data.id, nonce: data.nonce, expiresAt: data.expiresAt };
}
export function equalSecret(
  actual: string | null,
  expected: string | undefined,
) {
  if (!actual || !expected || expected.length < 32) return false;
  const a = Buffer.from(actual),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
