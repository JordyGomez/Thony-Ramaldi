import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { appointmentTestEnvironment as env } from "../playwright.appointments.config";
import { rdDate } from "../src/lib/appointments/types";
const fixture = "http://127.0.0.1:3337",
  origin = "http://127.0.0.1:3401";
let day: string;
const sql = (
  request: APIRequestContext,
  statement: string,
  values: unknown[] = [],
) =>
  request
    .post(fixture + "/__test/agenda-sql", { data: { sql: statement, values } })
    .then(async (r) => {
      expect(r.ok(), await r.text()).toBeTruthy();
      return r.json();
    });
const state = (request: APIRequestContext) =>
  request.get(fixture + "/__test/agenda-state").then((r) => r.json());
test.beforeEach(async ({ request, page }) => {
  const reset = await request.post(fixture + "/__test/reset");
  expect(reset.ok(), await reset.text()).toBeTruthy();
  const dateResponse = await request.get(fixture + "/__test/agenda-date");
  expect(dateResponse.ok(), await dateResponse.text()).toBeTruthy();
  day = (await dateResponse.json()).day;
  expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await page.route("https://challenges.cloudflare.com/turnstile/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.turnstile={render:function(selector,options){var el=document.querySelector(selector);if(el)el.textContent='Verificación aislada de pruebas';setTimeout(function(){options.callback('isolated-booking-captcha')},5);return 'isolated-widget'},remove:function(){}};`,
    }),
  );
});
async function login(page: Page, role = "owner") {
  await page.goto("/admin/login");
  await page.getByLabel("Correo", { exact: true }).fill(role + "@example.test");
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("isolated-password");
  await page
    .getByRole("button", { name: "Entrar al panel", exact: true })
    .click();
  await expect(page).not.toHaveURL(/\/admin\/login$/);
}
const admin = (request: APIRequestContext, body: Record<string, unknown>) =>
  request.post(origin + "/api/admin/citas", {
    headers: { Origin: origin },
    data: body,
  });
async function book(
  request: APIRequestContext,
  extra: Record<string, unknown> = {},
  start = day + "T08:00:00-04:00",
  id = randomUUID(),
) {
  return request.post(origin + "/api/citas", {
    headers: { Origin: origin },
    data: {
      idempotencyKey: id,
      captchaToken: "isolated-booking-captcha",
      website: "",
      booking: {
        name: "Cliente de prueba aislada",
        phone: "+18095550123",
        email: "client@example.test",
        kind: "general",
        modality: "presencial",
        startsAt: start,
        comments: "Comentarios ficticios de la prueba",
        communicationPreference: "email",
        operationalConsent: true,
        whatsappConsent: false,
        ...extra,
      },
    },
  });
}
async function create(
  request: APIRequestContext,
  extra: Record<string, unknown> = {},
  start?: string,
) {
  const r = await book(request, extra, start);
  expect(r.status(), await r.text()).toBe(201);
  return r.json();
}
async function confirm(page: Page, id: string) {
  const detail = await (
    await page.request.get(
      origin + "/api/admin/citas?kind=appointment&id=" + id,
    )
  ).json();
  const r = await admin(page.request, {
    action: "appointment",
    id,
    operation: "confirm",
    expected: detail.appointment.version,
    data: { instructions: "Lugar ficticio autorizado para pruebas" },
  });
  expect(r.status(), await r.text()).toBe(200);
}
const worker = (request: APIRequestContext) =>
  request.post(origin + "/api/internal/appointments/process", {
    headers: { Authorization: "Bearer " + env.APPOINTMENTS_SERVER_SECRET },
    data: {},
  });
async function completePublicForm(page: Page) {
  await page.getByRole("button", { name: "Elegir fecha", exact: true }).click();
  await expect(
    page.getByText("Consultando fechas disponibles…"),
  ).not.toBeVisible();
  const label = rdDate(day + "T12:00:00-04:00") + " · Disponible";
  if (!(await page.getByRole("button", { name: label, exact: true }).count()))
    await page.getByRole("button", { name: "Mes siguiente" }).click();
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.getByRole("button", { name: "Elegir hora", exact: true }).click();
  await page.getByRole("button", { name: /8:00/ }).first().click();
  await page.getByRole("button", { name: "Completar datos" }).click();
  await page
    .getByLabel("Nombre completo", { exact: true })
    .fill("Cliente de navegador aislado");
  await page.getByLabel("Teléfono internacional").fill("+1 809 555 0123");
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill("browser@example.test");
  await page
    .getByRole("checkbox", { name: /Autorizo el uso de mi nombre/ })
    .check();
  await page.getByRole("button", { name: "Revisar solicitud" }).click();
}

test("reserva pública completa, horario bloqueado y seguimiento personal sin confirmar prematuramente", async ({
  page,
  request,
}) => {
  await page.goto("/citas");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Agenda una visita",
  );
  await completePublicForm(page);
  await expect(
    page.getByText("Pendiente de confirmación", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Solicitar cita", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Solicitar cita", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Solicitud recibida", exact: true }),
  ).toBeVisible();
  const stored = await state(request);
  expect(stored.appointments).toHaveLength(1);
  expect(stored.appointments[0].status).toBe("pending");
  expect(stored.messages).toHaveLength(0);
  await page.getByRole("link", { name: "Ver estado de mi solicitud" }).click();
  await expect(
    page.getByRole("heading", { name: "Tu solicitud de cita." }),
  ).toBeVisible();
  await expect(
    page.getByText("Thony aún debe confirmar tu solicitud.", { exact: false }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/#/);
  const slots = await (
    await request.get(
      origin +
        "/api/citas/disponibilidad?type=general&modality=presencial&day=" +
        day,
    )
  ).json();
  expect(
    slots.slots.every(
      (s: { startsAt: string }) =>
        Date.parse(s.startsAt) >= Date.parse(day + "T10:30:00-04:00"),
    ),
  ).toBeTruthy();
});

test("dos solicitudes HTTP simultáneas compiten por un solo intervalo", async ({
  request,
}) => {
  const responses = await Promise.all([
    book(request, { email: "one@example.test" }),
    book(request, { email: "two@example.test" }),
  ]);
  expect(responses.map((r) => r.status()).sort()).toEqual([201, 409]);
  expect((await state(request)).appointments).toHaveLength(1);
});

test("idempotencia, validación, CAPTCHA y origen rechazan peticiones indebidas", async ({
  request,
}) => {
  const id = randomUUID();
  const one = await book(request, {}, undefined, id),
    two = await book(request, {}, undefined, id);
  expect(one.status()).toBe(201);
  expect(two.status()).toBe(201);
  expect((await one.json()).id).toBe((await two.json()).id);
  expect((await book(request, { status: "confirmed" })).status()).toBe(400);
  expect((await book(request, { phone: "123" })).status()).toBe(400);
  expect((await book(request, { operationalConsent: false })).status()).toBe(
    400,
  );
  const body = {
    idempotencyKey: randomUUID(),
    captchaToken: "bad-captcha",
    booking: {
      name: "Prueba",
      phone: "+18095550124",
      email: "x@example.test",
      kind: "general",
      modality: "presencial",
      startsAt: day + "T12:00:00-04:00",
      comments: "",
      communicationPreference: "email",
      operationalConsent: true,
      whatsappConsent: false,
    },
  };
  expect(
    (
      await request.post("/api/citas", {
        headers: { Origin: origin },
        data: body,
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/citas", {
        headers: { Origin: "https://untrusted.example.test" },
        data: body,
      })
    ).status(),
  ).toBe(403);
});

test("rutas privadas, administradores legados y agentes sin concesión específica quedan fuera", async ({
  page,
  request,
}) => {
  expect((await request.get("/api/admin/citas")).status()).toBe(401);
  await page.goto("/admin/citas");
  await expect(page).toHaveURL(/admin\/login/);
  for (const role of ["legacy", "agent", "admin"]) {
    await login(page, role);
    expect((await page.request.get("/api/admin/citas")).status()).toBe(403);
    expect(
      (
        await page.request.post("/api/admin/citas", {
          headers: { Origin: origin },
          data: {
            action: "search_leads",
            filters: { query: "client@example.test" },
          },
        })
      ).status(),
    ).toBe(403);
    await page.context().clearCookies();
  }
  await login(page, "super");
  await expect(
    page.getByRole("link", { name: "Citas de Thony" }),
  ).toBeVisible();
});

test("Thony aprueba desde el panel y el cliente obtiene un ICS válido", async ({
  page,
  request,
}) => {
  const appointment = await create(request);
  expect((await request.get("/api/citas/calendario")).status()).toBe(409);
  await login(page);
  await page.goto("/admin/citas?solicitud=" + appointment.id);
  await expect(
    page.getByRole("heading", {
      name: "Cliente de prueba aislada",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirmar cita", exact: true })
    .click();
  await page
    .getByLabel("Lugar o instrucciones confirmadas")
    .fill("Oficina ficticia para pruebas");
  await page
    .getByRole("button", { name: "Confirmar acción", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Solicitud actualizada" }),
  ).toBeVisible();
  const stored = await state(request);
  expect(stored.appointments[0].status).toBe("confirmed");
  expect(
    stored.jobs.some((j: { event: string }) => j.event === "reminder_24h"),
  ).toBeTruthy();
  await request.post("/api/citas/acceso", {
    headers: { Origin: origin },
    data: { token: appointment.managementToken },
  });
  const ics = await request.get("/api/citas/calendario");
  expect(ics.status()).toBe(200);
  expect(ics.headers()["content-type"]).toContain("text/calendar");
  expect(await ics.text()).toContain("STATUS:CONFIRMED");
  expect(await ics.text()).toMatch(/DTSTART:\d{8}T\d{6}Z/);
});

test("cliente A no puede leer la cita B manipulando ID o firma", async ({
  request,
}) => {
  const a = await create(request),
    b = await create(
      request,
      { email: "other@example.test", name: "Otra persona aislada" },
      day + "T12:00:00-04:00",
    );
  await request.post("/api/citas/acceso", {
    headers: { Origin: origin },
    data: { token: a.managementToken },
  });
  const own = await (await request.get("/api/citas/gestion?id=" + b.id)).json();
  expect(own.appointment.id).toBe(a.id);
  expect(JSON.stringify(own)).not.toContain("other@example.test");
  const parts = a.managementToken.split(".");
  const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString());
  payload.id = b.id;
  expect(
    (
      await request.post("/api/citas/acceso", {
        headers: { Origin: origin },
        data: {
          token:
            Buffer.from(JSON.stringify(payload)).toString("base64url") +
            "." +
            parts[1],
        },
      })
    ).status(),
  ).toBe(401);
});

test("reprogramación mantiene el original, espera al cliente e invalida recordatorios antiguos", async ({
  page,
  request,
}) => {
  const a = await create(request);
  await login(page);
  await confirm(page, a.id);
  const detail = await (
    await page.request.get("/api/admin/citas?kind=appointment&id=" + a.id)
  ).json();
  const next = day + "T12:00:00-04:00";
  expect(
    (
      await admin(page.request, {
        action: "appointment",
        id: a.id,
        operation: "propose",
        expected: detail.appointment.version,
        data: { startsAt: next },
      })
    ).status(),
  ).toBe(200);
  const before = await state(request);
  expect(before.appointments[0].starts_at).not.toBe(
    new Date(next).toISOString(),
  );
  await request.post("/api/citas/acceso", {
    headers: { Origin: origin },
    data: { token: a.managementToken },
  });
  expect(
    (
      await request.post("/api/citas/gestion", {
        headers: { Origin: origin },
        data: { action: "accept_proposal" },
      })
    ).status(),
  ).toBe(200);
  const after = await state(request);
  expect(Date.parse(after.appointments[0].starts_at)).toBe(Date.parse(next));
  expect(after.appointments[0].schedule_version).toBe(1);
  expect(
    after.jobs
      .filter(
        (j: { event: string; schedule_version: number }) =>
          j.event.startsWith("reminder_") && j.schedule_version === 0,
      )
      .every((j: { status: string }) => j.status === "cancelled"),
  ).toBeTruthy();
});

test("cliente cancela su cita, libera el horario y no recibe recordatorios cancelados", async ({
  page,
  request,
}) => {
  const a = await create(request);
  await login(page);
  await confirm(page, a.id);
  await request.post("/api/citas/acceso", {
    headers: { Origin: origin },
    data: { token: a.managementToken },
  });
  expect(
    (
      await request.post("/api/citas/gestion", {
        headers: { Origin: origin },
        data: { action: "cancel" },
      })
    ).status(),
  ).toBe(200);
  const stored = await state(request);
  expect(stored.appointments[0].status).toBe("cancelled_client");
  expect(
    stored.jobs
      .filter((j: { event: string }) => j.event.startsWith("reminder_"))
      .every((j: { status: string }) => j.status === "cancelled"),
  ).toBeTruthy();
  const again = await book(request, { email: "new@example.test" });
  expect(again.status()).toBe(201);
});

test("worker autenticado envía por APIs oficiales, respeta consentimiento y no duplica avisos", async ({
  request,
}) => {
  await create(request);
  expect(
    (
      await request.post("/api/internal/appointments/process", { data: {} })
    ).status(),
  ).toBe(401);
  const run = await worker(request);
  expect(run.status(), await run.text()).toBe(200);
  const first = await state(request);
  expect(first.messages.length).toBe(3);
  expect(
    first.jobs.filter((j: { status: string }) => j.status === "sent"),
  ).toHaveLength(3);
  expect(
    first.jobs.some((j: { status: string }) => j.status === "delivered"),
  ).toBeFalsy();
  expect(
    first.messages.filter((m: { path: string }) => m.path.includes("/meta/")),
  ).toHaveLength(1);
  await worker(request);
  expect((await state(request)).messages).toHaveLength(3);
});

test("remitente de correo no verificado bloquea el canal sin perder la solicitud", async ({
  request,
  page,
}) => {
  await request.post(fixture + "/__test/provider-mode", {
    data: { domainVerified: false },
  });
  await create(request);
  expect((await worker(request)).status()).toBe(200);
  const stored = await state(request);
  expect(stored.appointments).toHaveLength(1);
  expect(
    stored.jobs
      .filter((j: { channel: string }) => j.channel === "email")
      .every(
        (j: { status: string; sent_at: null }) =>
          j.status === "blocked" && j.sent_at === null,
      ),
  ).toBeTruthy();
  await login(page);
  await page.goto("/admin/citas");
  await expect(
    page.locator('summary span[data-state="blocked"]').first(),
  ).toBeVisible();
});

test("webhook Resend: firma, entrega, replay y ausencia de confirmaciones falsas", async ({
  request,
}) => {
  await create(request);
  await worker(request);
  const before = await state(request),
    job = before.jobs.find(
      (j: { channel: string; recipient: string }) =>
        j.channel === "email" && j.recipient === "client",
    );
  const raw = JSON.stringify({
      type: "email.delivered",
      created_at: new Date().toISOString(),
      data: { email_id: job.provider_id, tags: { agenda_job: job.id } },
    }),
    eventId = "isolated-event-" + randomUUID(),
    timestamp = String(Math.floor(Date.now() / 1000));
  const signature =
    "v1," +
    createHmac(
      "sha256",
      Buffer.from(env.RESEND_WEBHOOK_SECRET.slice(6), "base64"),
    )
      .update(eventId + "." + timestamp + "." + raw)
      .digest("base64");
  const options = {
    headers: {
      "content-type": "application/json",
      "svix-id": eventId,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    },
    data: raw,
  };
  expect(
    (
      await request.post("/api/webhooks/appointments/resend", {
        ...options,
        headers: { ...options.headers, "svix-signature": "v1,bad" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (await request.post("/api/webhooks/appointments/resend", options)).status(),
  ).toBe(200);
  expect(
    (await request.post("/api/webhooks/appointments/resend", options)).status(),
  ).toBe(200);
  const after = await state(request);
  expect(after.jobs.find((j: { id: string }) => j.id === job.id).status).toBe(
    "delivered",
  );
});

test("webhook Meta verifica app, remitente y firma antes de registrar entrega", async ({
  request,
}) => {
  await create(request);
  await worker(request);
  const before = await state(request),
    job = before.jobs.find(
      (j: { channel: string }) => j.channel === "whatsapp",
    );
  const event = {
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: env.WHATSAPP_PHONE_NUMBER_ID },
              statuses: [
                {
                  id: job.provider_id,
                  status: "delivered",
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  biz_opaque_callback_data: job.id + ":" + job.claim_token,
                },
              ],
            },
          },
        ],
      },
    ],
  };
  const raw = JSON.stringify(event),
    signature =
      "sha256=" +
      createHmac("sha256", env.WHATSAPP_APP_SECRET).update(raw).digest("hex");
  expect(
    (
      await request.post("/api/webhooks/appointments/meta", {
        headers: {
          "content-type": "application/json",
          "x-hub-signature-256": "sha256=invalid",
        },
        data: raw,
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/webhooks/appointments/meta", {
        headers: {
          "content-type": "application/json",
          "x-hub-signature-256": signature,
        },
        data: raw,
      })
    ).status(),
  ).toBe(200);
  expect(
    (await state(request)).jobs.find((j: { id: string }) => j.id === job.id)
      .status,
  ).toBe("delivered");
});

test("CRM busca por POST, conserva notas/tareas y exige permiso separado de exportación", async ({
  page,
  request,
}) => {
  await create(request);
  await login(page);
  await page.goto("/admin/clientes-potenciales");
  await page
    .getByLabel("Nombre, teléfono o correo")
    .fill("client@example.test");
  await page
    .getByRole("button", { name: "Buscar clientes", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "1 clientes en esta selección" }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/client@example/);
  await page
    .getByRole("button", { name: "Abrir ficha de Cliente de prueba aislada" })
    .click();
  await page
    .getByLabel("Nueva nota interna")
    .fill("Seguimiento privado de prueba");
  await page.getByRole("button", { name: "Guardar nota del cliente" }).click();
  await expect(
    page.getByText("Seguimiento privado de prueba", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Título del seguimiento").fill("Revisar alternativas");
  await page
    .getByLabel("Fecha y hora (RD)", { exact: true })
    .fill(day + "T15:00");
  await page.getByRole("button", { name: "Crear tarea privada" }).click();
  await expect(
    page.getByText("Revisar alternativas", { exact: false }),
  ).toBeVisible();
  expect(
    (
      await page.request.get(
        "/api/admin/citas?kind=leads&query=client@example.test",
      )
    ).status(),
  ).toBe(400);
  const exported = await admin(page.request, { action: "export" });
  expect(exported.status()).toBe(200);
  expect(exported.headers()["content-type"]).toContain("text/csv");
  expect(await exported.text()).toContain("client@example.test");
  expect(await exported.text()).not.toContain("Seguimiento privado");
});

test("PC y móvil: calendario completo, datos legibles, sin overflow y accesibilidad", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/citas");
  await page.getByRole("button", { name: "Elegir fecha", exact: true }).click();
  await expect(
    page.locator('table[aria-label="Calendario de disponibilidad"]'),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBeTruthy();
  await expect(
    page.getByText("Consultando fechas disponibles…"),
  ).not.toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page
    .locator("main")
    .screenshot({ path: "test-results/agenda-public-mobile.png" });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await login(page);
  await page.goto("/admin/citas");
  await page.getByRole("button", { name: "Mes", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /intervalos reservados/ }).first(),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBeTruthy();
  await expect(
    page.getByText("Consultando intervalos reservados…"),
  ).not.toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/agenda-admin-mobile.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/admin/citas/configuracion");
  await expect(
    page.getByRole("heading", {
      name: "Horarios y configuración",
      exact: true,
    }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBeTruthy();
});

test("vencimiento HTTP libera la reserva y bloquea una confirmación tardía", async ({
  page,
  request,
}) => {
  const a = await create(request);
  await sql(
    request,
    "update appointments set hold_expires_at=now()-interval '1 second' where id=$1",
    [a.id],
  );
  const available = await request.get(
    `/api/citas/disponibilidad?type=general&modality=presencial&day=${day}`,
  );
  expect(available.status()).toBe(200);
  expect(
    (await available.json()).slots.some(
      (s: { startsAt: string }) =>
        Date.parse(s.startsAt) === Date.parse(day + "T08:00:00-04:00"),
    ),
  ).toBeTruthy();
  await login(page);
  const detail = await (
    await page.request.get("/api/admin/citas?kind=appointment&id=" + a.id)
  ).json();
  expect(detail.appointment.status).toBe("expired");
  const late = await admin(page.request, {
    action: "appointment",
    id: a.id,
    operation: "confirm",
    expected: detail.appointment.version,
    data: { instructions: "Lugar de prueba" },
  });
  expect(late.status()).toBe(409);
  expect((await book(request, { email: "next@example.test" })).status()).toBe(
    201,
  );
});

test("cliente retira WhatsApp sin cancelar su cita ni enviar avisos sin consentimiento", async ({
  page,
  request,
}) => {
  const a = await create(request, {
    communicationPreference: "both",
    whatsappConsent: true,
  });
  await login(page);
  await confirm(page, a.id);
  await request.post("/api/citas/acceso", {
    headers: { Origin: origin },
    data: { token: a.managementToken },
  });
  const withdrawn = await request.post("/api/citas/gestion", {
    headers: { Origin: origin },
    data: {
      action: "preferences",
      whatsappConsent: false,
      communicationPreference: "email",
    },
  });
  expect(withdrawn.status(), await withdrawn.text()).toBe(200);
  const own = (await withdrawn.json()).appointment;
  expect(own.status).toBe("confirmed");
  expect(own.whatsappConsent).toBe(false);
  await worker(request);
  const stored = await state(request);
  expect(
    stored.messages.filter(
      (m: { path: string; data: { to: string } }) =>
        m.path.includes("/meta/") && m.data.to === "18095550123",
    ),
  ).toHaveLength(0);
  expect(
    stored.jobs
      .filter(
        (j: { recipient: string; channel: string }) =>
          j.recipient === "client" && j.channel === "whatsapp",
      )
      .every((j: { status: string }) => j.status === "cancelled"),
  ).toBeTruthy();
});

test("cambios simultáneos de reglas conservan el formulario local y rechazan sobrescritura", async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto("/admin/citas/configuracion");
  await page.getByLabel("Máximo de citas diarias").fill("5");
  await sql(request, "update appointment_settings set revision=revision+1");
  await page
    .getByRole("button", { name: "Guardar reglas de reserva", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "La configuración cambió" }),
  ).toBeVisible();
  await expect(page.getByLabel("Máximo de citas diarias")).toHaveValue("5");
});

test("separación de permisos: técnico de agenda sin CRM no lee ni exporta clientes", async ({
  page,
  request,
}) => {
  await create(request);
  await sql(
    request,
    "update appointment_access_grants set can_read_leads=false,can_export=false where kind='technical'",
  );
  await login(page, "super");
  await expect(
    page.getByRole("link", { name: "Citas de Thony", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Clientes potenciales", exact: true }),
  ).toHaveCount(0);
  expect((await page.request.get("/api/admin/citas?kind=leads")).status()).toBe(
    403,
  );
  expect((await admin(page.request, { action: "export" })).status()).toBe(403);
  expect(
    (
      await page.request.get(
        "/api/admin/citas?kind=calendar&from=" +
          encodeURIComponent(day + "T00:00:00-04:00") +
          "&until=" +
          encodeURIComponent(day + "T23:59:00-04:00"),
      )
    ).status(),
  ).toBe(200);
});

test("429 reintenta con la misma clave y un mensaje Meta aceptado sin respuesta queda incierto sin duplicarse", async ({
  request,
}) => {
  await create(request, {
    whatsappConsent: true,
    communicationPreference: "both",
  });
  await request.post(fixture + "/__test/provider-mode", {
    data: { mode: "retry" },
  });
  expect((await worker(request)).status()).toBe(200);
  let snapshot = await state(request);
  expect(snapshot.messages).toHaveLength(0);
  expect(
    snapshot.jobs.filter((j: { status: string }) => j.status === "retry"),
  ).toHaveLength(4);
  await request.post(fixture + "/__test/provider-mode", {
    data: { mode: "uncertain" },
  });
  await sql(
    request,
    "update notification_jobs set available_at=now()-interval '1 second' where status='retry'",
  );
  await worker(request);
  snapshot = await state(request);
  expect(snapshot.messages).toHaveLength(4);
  expect(
    snapshot.jobs.some(
      (j: { channel: string; status: string }) =>
        j.channel === "whatsapp" && j.status === "uncertain",
    ),
  ).toBeTruthy();
  await request.post(fixture + "/__test/provider-mode", {
    data: { mode: "ready" },
  });
  await sql(
    request,
    "update notification_jobs set available_at=now()-interval '1 second' where status='retry'",
  );
  await worker(request);
  snapshot = await state(request);
  expect(snapshot.messages).toHaveLength(4);
  expect(
    snapshot.jobs.filter((j: { status: string }) => j.status === "sent"),
  ).toHaveLength(2);
  expect(
    snapshot.jobs.filter((j: { status: string }) => j.status === "uncertain"),
  ).toHaveLength(2);
});
