import { createHash } from "node:crypto";
import { getPlatformSnapshot } from "@/data/get-platform";
import { createAdminClient, getAdminUser } from "@/lib/supabase/server";
import {
  AdminError,
  adminFailure,
  adminJson,
  checkOrigin,
} from "@/lib/admin-access";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await request.text();
    if (Buffer.byteLength(body) > 8000)
      throw new AdminError("Solicitud demasiado grande.", 413);
    const input = JSON.parse(body);
    if (!["signup", "accept", "recover", "password"].includes(input.action))
      throw new AdminError("Acción no válida.");
    const origin = request.headers.get("origin")!;
    const supabase = await createAdminClient();
    if (input.action === "password") {
      const { user } = await getAdminUser();
      if (!user)
        throw new AdminError(
          "Confirma tu acceso mediante el correo de recuperación.",
          401,
        );
      if (
        typeof input.password !== "string" ||
        input.password.length < 12 ||
        input.password.length > 128
      )
        throw new AdminError(
          "Usa una contraseña de entre 12 y 128 caracteres.",
        );
      const { error } = await supabase.auth.updateUser({
        password: input.password,
      });
      if (error)
        throw new AdminError(
          "No se pudo actualizar la contraseña. Solicita un nuevo enlace de recuperación.",
        );
      await supabase.auth.signOut();
      return adminJson({
        ok: true,
        message: "Contraseña actualizada. Inicia sesión de nuevo.",
      });
    }
    if (
      typeof input.email !== "string" ||
      input.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)
    )
      throw new AdminError("Escribe un correo válido.");
    if (input.action === "recover") {
      // Auth aplica los límites y CAPTCHA configurados en el proyecto existente.
      const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
        redirectTo: `${origin}/auth/confirm?next=/admin/cuenta`,
        ...(typeof input.captchaToken === "string"
          ? { captchaToken: input.captchaToken }
          : {}),
      });
      if (error)
        throw new AdminError(
          "No se pudo procesar la recuperación. Reintenta más tarde o completa la verificación.",
          429,
        );
      return adminJson({
        ok: true,
        message:
          "Si el correo corresponde a una cuenta, recibirás las instrucciones de recuperación.",
      });
    }
    const platform = await getPlatformSnapshot();
    if (platform?.mode !== "ramaldi" || !platform.registrationEnabled)
      throw new AdminError("La incorporación empresarial está cerrada.", 403);
    if (typeof input.token !== "string" || !/^[a-f0-9]{64}$/.test(input.token))
      throw new AdminError("Necesitas una invitación válida.", 403);
    const tokenHash = createHash("sha256").update(input.token).digest("hex");
    if (input.action === "accept") {
      const { user } = await getAdminUser();
      if (!user || !user.email_confirmed_at)
        throw new AdminError(
          "Inicia sesión con el correo verificado de tu invitación.",
          401,
        );
      const { error } = await supabase.rpc("accept_membership_invitation", {
        p_token_hash: tokenHash,
        p_application: {
          name: typeof input.name === "string" ? input.name.slice(0, 80) : "",
          description:
            typeof input.description === "string"
              ? input.description.slice(0, 2000)
              : "",
        },
      });
      if (error)
        throw new AdminError(
          "La invitación no está disponible para esta cuenta. Comprueba el correo, la vigencia y el estado de incorporación.",
          403,
        );
      return adminJson({
        ok: true,
        message:
          "Solicitud enviada. Una cuenta verificada no concede permisos hasta su aprobación.",
      });
    }
    if (!process.env.NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY)
      throw new AdminError(
        "El registro requiere configurar la protección CAPTCHA de Supabase Auth antes de habilitarse.",
        503,
      );
    if (
      typeof input.captchaToken !== "string" ||
      input.captchaToken.length < 10
    )
      throw new AdminError("Completa la verificación de seguridad.", 400);
    if (
      typeof input.password !== "string" ||
      input.password.length < 12 ||
      input.password.length > 128
    )
      throw new AdminError("Usa una contraseña de entre 12 y 128 caracteres.");
    const valid = await supabase.rpc("check_membership_invitation", {
      p_email: input.email,
      p_token_hash: tokenHash,
    });
    if (valid.error || valid.data !== true)
      throw new AdminError("La invitación no está disponible.", 403);
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?next=/admin/registro`,
        captchaToken: input.captchaToken,
        data: { platform_invitation: tokenHash },
      },
    });
    if (error)
      throw new AdminError(
        "No se pudo completar el registro. Revisa tu invitación, la verificación o intenta más tarde.",
        400,
      );
    return adminJson({
      ok: true,
      message:
        "Revisa tu correo para verificar la cuenta. Después vuelve a abrir tu invitación, inicia sesión y envía la solicitud de incorporación.",
    });
  } catch (error) {
    return adminFailure(
      error instanceof SyntaxError
        ? new AdminError("Solicitud no válida.")
        : error,
    );
  }
}
