import "server-only";
import { cookies } from "next/headers";
import { AppointmentError, type CustomerGrant } from "./types";
import { verifyCustomerGrant } from "./tokens";
export const customerCookie = "thony_appointment_access";
export async function customerGrant() {
  const token = (await cookies()).get(customerCookie)?.value;
  if (!token)
    throw new AppointmentError(
      "Abre el enlace personal de tu solicitud para continuar.",
      401,
    );
  return verifyCustomerGrant(token);
}
export function setCustomerCookie(
  response: Response,
  request: Request,
  token: string,
  grant: CustomerGrant,
) {
  const secure =
    new URL(request.url).protocol === "https:" || process.env.VERCEL === "1";
  const maxAge = Math.max(
    0,
    Math.min(grant.expiresAt - Math.floor(Date.now() / 1000), 30 * 86400),
  );
  response.headers.append(
    "Set-Cookie",
    `${customerCookie}=${token}; Path=/api/citas; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`,
  );
  return response;
}
