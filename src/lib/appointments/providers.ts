import "server-only";
import type {
  IntegrationStatus,
  NotificationJob,
  ProviderStatus,
} from "./types";
import { buildNotification } from "./templates";
import { signCustomerGrant } from "./tokens";
import { site } from "@/lib/site";
export function previewReadOnly() {
  return process.env.VERCEL_ENV === "preview";
}
export function bookingEnvironmentReady() {
  return (
    !previewReadOnly() &&
    !!process.env.NEXT_PUBLIC_APPOINTMENTS_CAPTCHA_SITE_KEY &&
    !!process.env.APPOINTMENTS_TURNSTILE_SECRET &&
    (process.env.APPOINTMENTS_SERVER_SECRET?.length ?? 0) >= 32 &&
    (process.env.APPOINTMENTS_LINK_SIGNING_SECRET?.length ?? 0) >= 32
  );
}
function fixtureBase() {
  const value = process.env.APPOINTMENTS_TEST_PROVIDER_URL;
  if (
    process.env.THONY_APPOINTMENT_TESTS === "1" &&
    !process.env.VERCEL_ENV &&
    value &&
    /^http:\/\/127\.0\.0\.1:\d+$/.test(value)
  )
    return value;
  return null;
}
export function providerUrl(
  provider: "resend" | "meta" | "turnstile",
  path = "",
) {
  const test = fixtureBase();
  if (test) return `${test}/providers/${provider}${path}`;
  return provider === "resend"
    ? "https://api.resend.com" + path
    : provider === "meta"
      ? "https://graph.facebook.com" + path
      : "https://challenges.cloudflare.com/turnstile/v0/siteverify";
}
export function publicAppointmentOrigin() {
  const origin = process.env.APPOINTMENTS_PUBLIC_ORIGIN || site.url;
  if (!origin) throw new Error("appointment_origin_missing");
  const url = new URL(origin);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (url.protocol !== "https:" &&
      !(fixtureBase() && url.hostname === "127.0.0.1"))
  )
    throw new Error("appointment_origin_invalid");
  return url.origin;
}
const missing = (reason: string): ProviderStatus => ({
  configured: false,
  ready: false,
  reason,
});
const waiting = (reason: string): ProviderStatus => ({
  configured: true,
  ready: false,
  reason,
});
const ready: ProviderStatus = {
  configured: true,
  ready: true,
  reason:
    "Configurado y verificado con el proveedor; los envíos se registran por separado.",
};
function emailAddress(from: string) {
  return (from.match(/<([^<>]+)>$/)?.[1] || from).trim().toLowerCase();
}
async function emailStatus(verify: boolean): Promise<ProviderStatus> {
  const token = process.env.RESEND_API_KEY,
    from = process.env.APPOINTMENTS_EMAIL_FROM,
    domain = process.env.RESEND_DOMAIN_ID;
  if (!token || !from || !domain || !process.env.RESEND_WEBHOOK_SECRET)
    return missing(
      "Faltan API key, remitente, dominio o secreto de webhook de Resend.",
    );
  if (
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(emailAddress(from)) ||
    !/^[-a-z0-9]+$/i.test(domain)
  )
    return waiting("Revisa el remitente y el identificador de dominio.");
  if (!verify)
    return waiting(
      "Credenciales presentes; falta comprobar el dominio con Resend.",
    );
  try {
    const r = await fetch(providerUrl("resend", "/domains/" + domain), {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
    if (!r.ok)
      return waiting("No se pudo verificar el dominio de envío con Resend.");
    const d = await r.json();
    return d.status === "verified" &&
      d.name?.toLowerCase() === emailAddress(from).split("@")[1]
      ? ready
      : waiting("El dominio del remitente todavía no está verificado.");
  } catch {
    return waiting("Resend no respondió a la comprobación del dominio.");
  }
}
async function whatsappStatus(verify: boolean): Promise<ProviderStatus> {
  const e = process.env;
  const required = [
    e.WHATSAPP_ACCESS_TOKEN,
    e.WHATSAPP_PHONE_NUMBER_ID,
    e.WHATSAPP_BUSINESS_ACCOUNT_ID,
    e.WHATSAPP_API_VERSION,
    e.WHATSAPP_TEMPLATE_OWNER,
    e.WHATSAPP_TEMPLATE_CLIENT,
    e.WHATSAPP_APP_SECRET,
    e.WHATSAPP_VERIFY_TOKEN,
  ];
  if (required.some((v) => !v))
    return missing(
      "Falta configurar Meta, remitente, plantillas aprobadas o webhooks.",
    );
  if (
    !/^v\d{2}\.\d+$/.test(e.WHATSAPP_API_VERSION!) ||
    ![e.WHATSAPP_PHONE_NUMBER_ID!, e.WHATSAPP_BUSINESS_ACCOUNT_ID!].every((v) =>
      /^\d{4,40}$/.test(v),
    ) ||
    ![e.WHATSAPP_TEMPLATE_OWNER!, e.WHATSAPP_TEMPLATE_CLIENT!].every((v) =>
      /^[a-z0-9_]{1,100}$/.test(v),
    )
  )
    return waiting(
      "Revisa los identificadores, versión y nombres de plantilla de Meta.",
    );
  if (!verify)
    return waiting(
      "Credenciales presentes; remitente y plantillas aún no comprobados.",
    );
  const get = async (path: string) => {
    const r = await fetch(
      providerUrl("meta", `/${e.WHATSAPP_API_VERSION}/${path}`),
      {
        headers: { Authorization: "Bearer " + e.WHATSAPP_ACCESS_TOKEN },
        cache: "no-store",
        signal: AbortSignal.timeout(7000),
      },
    );
    if (!r.ok) throw new Error("meta_verification_failed");
    return r.json();
  };
  try {
    const sender = await get(
      `${e.WHATSAPP_PHONE_NUMBER_ID}?fields=id,display_phone_number,code_verification_status`,
    );
    if (
      sender.id !== e.WHATSAPP_PHONE_NUMBER_ID ||
      sender.code_verification_status !== "VERIFIED"
    )
      return waiting("El remitente de WhatsApp aún no está verificado.");
    if (
      String(sender.display_phone_number).replace(/\D/g, "") === "18294045770"
    )
      return waiting(
        "El remitente debe ser distinto del número destinatario de Thony.",
      );
    for (const template of new Set([
      e.WHATSAPP_TEMPLATE_OWNER!,
      e.WHATSAPP_TEMPLATE_CLIENT!,
    ])) {
      const templates = await get(
        `${e.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?name=${encodeURIComponent(template)}&limit=100`,
      );
      const found = templates.data?.find(
        (t: {
          name: string;
          language: string;
          status: string;
          category: string;
        }) =>
          t.name === template &&
          t.language === (e.WHATSAPP_TEMPLATE_LANGUAGE || "es") &&
          t.status === "APPROVED" &&
          t.category === "UTILITY",
      );
      if (!found)
        return waiting(
          "Falta una plantilla operativa aprobada en el idioma configurado.",
        );
      const components = found.components as
        | Array<{ type: string; text?: string; buttons?: unknown[] }>
        | undefined;
      const body = components?.find((c) => c.type === "BODY");
      const parameters =
        body?.text
          ?.match(/\{\{\s*\d+\s*\}\}/g)
          ?.map((v) => Number(v.replace(/\D/g, ""))) || [];
      if (
        parameters.length !== 13 ||
        parameters.some((v, i) => v !== i + 1) ||
        components?.some(
          (c) =>
            c.type !== "BODY" &&
            (c.text?.includes("{{") ||
              c.type === "BUTTONS" ||
              (c.type === "HEADER" && !c.text)),
        )
      )
        return waiting(
          "La plantilla debe usar exactamente los 13 parámetros BODY del contrato de citas, sin botones ni encabezados dinámicos.",
        );
    }
    return ready;
  } catch {
    return waiting(
      "No se pudo verificar el remitente o las plantillas con Meta.",
    );
  }
}
export async function integrations(verify = false): Promise<IntegrationStatus> {
  const [email, whatsapp] = await Promise.all([
    emailStatus(verify),
    whatsappStatus(verify),
  ]);
  return {
    bookingReady: bookingEnvironmentReady(),
    captcha:
      !!process.env.NEXT_PUBLIC_APPOINTMENTS_CAPTCHA_SITE_KEY &&
      !!process.env.APPOINTMENTS_TURNSTILE_SECRET,
    links: (process.env.APPOINTMENTS_LINK_SIGNING_SECRET?.length ?? 0) >= 32,
    server: (process.env.APPOINTMENTS_SERVER_SECRET?.length ?? 0) >= 32,
    email,
    whatsapp,
  };
}
export type SendOutcome = {
  status: "sent" | "retry" | "failed" | "uncertain" | "blocked";
  provider: "resend" | "meta" | null;
  providerId: string | null;
  error: string | null;
};
export async function sendNotification(
  job: NotificationJob,
  status: IntegrationStatus,
): Promise<SendOutcome> {
  const provider = job.channel === "email" ? "resend" : "meta";
  const health = job.channel === "email" ? status.email : status.whatsapp;
  if (previewReadOnly() || !health.ready)
    return {
      status: "blocked",
      provider: null,
      providerId: null,
      error: previewReadOnly()
        ? "preview_sending_disabled"
        : "provider_not_ready",
    };
  const origin = publicAppointmentOrigin();
  const link =
    job.recipient === "owner"
      ? `${origin}/admin/citas?solicitud=${job.appointment_id}`
      : `${origin}/citas/seguimiento#${signCustomerGrant(job.payload.grant!)}`;
  const rendered = buildNotification(job, link, origin);
  try {
    let r: Response;
    if (provider === "resend")
      r = await fetch(providerUrl("resend", "/emails"), {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json",
          "Idempotency-Key": "thony-agenda/" + job.id,
        },
        body: JSON.stringify({
          from: process.env.APPOINTMENTS_EMAIL_FROM,
          to: [
            job.recipient === "owner"
              ? job.payload.ownerEmail
              : job.payload.email,
          ],
          reply_to: job.payload.ownerEmail,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          ...(rendered.attachments.length
            ? { attachments: rendered.attachments }
            : {}),
          tags: [{ name: "agenda_job", value: job.id }],
        }),
        signal: AbortSignal.timeout(10000),
      });
    else
      r = await fetch(
        providerUrl(
          "meta",
          `/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        ),
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + process.env.WHATSAPP_ACCESS_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: (job.recipient === "owner"
              ? job.payload.ownerWhatsapp
              : job.payload.phone
            ).replace(/\D/g, ""),
            type: "template",
            biz_opaque_callback_data: job.id + ":" + job.claim_token,
            template: {
              name:
                job.recipient === "owner"
                  ? process.env.WHATSAPP_TEMPLATE_OWNER
                  : process.env.WHATSAPP_TEMPLATE_CLIENT,
              language: {
                code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "es",
              },
              components: [
                {
                  type: "body",
                  parameters: rendered.whatsappParameters.map((text) => ({
                    type: "text",
                    text,
                  })),
                },
              ],
            },
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
    let body;
    try {
      body = await r.json();
    } catch {
      return {
        status: provider === "resend" ? "retry" : "uncertain",
        provider,
        providerId: null,
        error: "provider_response_invalid",
      };
    }
    const id = provider === "resend" ? body.id : body.messages?.[0]?.id;
    if (r.ok && typeof id === "string" && id.length >= 3 && id.length <= 240)
      return { status: "sent", provider, providerId: id, error: null };
    if (
      r.status === 429 ||
      (provider === "resend" &&
        (r.status >= 500 ||
          (r.status === 409 &&
            body.name === "concurrent_idempotent_requests"))) ||
      (provider === "meta" && body.error?.is_transient === true)
    )
      return {
        status: "retry",
        provider,
        providerId: null,
        error: "provider_retryable_" + r.status,
      };
    if (provider === "meta" && r.status >= 500)
      return {
        status: "uncertain",
        provider,
        providerId: null,
        error: "provider_result_uncertain",
      };
    return {
      status: "failed",
      provider,
      providerId: null,
      error: "provider_rejected_" + r.status,
    };
  } catch {
    return {
      status: provider === "resend" ? "retry" : "uncertain",
      provider,
      providerId: null,
      error: "provider_network_interrupted",
    };
  }
}
