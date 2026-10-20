import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
const fixture = "http://127.0.0.1:3336";
const jpeg = readFileSync("public/images/thony-paulino.jpg");
let ids: Record<string, { id: string }>;
test.beforeEach(async ({ request, page }) => {
  const state = await (await request.post(`${fixture}/__test/reset`)).json();
  ids = state.users;
  await page.route("https://challenges.cloudflare.com/**", (r) => r.abort());
});
async function login(page: Page, name: string) {
  await page.goto("http://127.0.0.1:3400/admin/login");
  await page.getByLabel("Correo", { exact: true }).fill(`${name}@example.test`);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("isolated-password");
  await page
    .getByRole("button", { name: "Entrar al panel", exact: true })
    .click();
  await expect(page).not.toHaveURL(/\/admin\/login$/);
}
const action = (page: Page, input: Record<string, unknown>) =>
  page.request.post("http://127.0.0.1:3400/api/admin/platform", {
    headers: { Origin: "http://127.0.0.1:3400" },
    data: input,
  });
async function activate(page: Page, registration = false) {
  await page.request.post(`${fixture}/__test/prepare`, {
    data: { registration },
  });
  const result = await action(page, {
    action: "mode",
    target: "ramaldi",
    revision: 0,
    confirmation: "CAMBIAR A RAMALDI",
  });
  expect(result.status()).toBe(200);
}
const state = (page: Page) =>
  page.request.get(`${fixture}/__test/state`).then((r) => r.json());

test("Thony predeterminado: sin registro empresarial, selector, directorio ni vista previa pública", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator("#hero-title")).toHaveText(
    "Tu próximo espacio. Tu próxima historia.",
  );
  await expect(page.locator(".site-experience")).toHaveAttribute(
    "data-motion",
    "off",
  );
  await expect(page.getByText("Modo de operación")).toHaveCount(0);
  expect((await request.get("/asesores")).status()).toBe(404);
  expect((await request.get("/admin/registro")).status()).toBe(404);
  expect((await request.get("/api/admin/platform")).status()).toBe(401);
  const html = await (await request.get("/?mode=ramaldi")).text();
  expect(html).toContain("THONY PAULINO");
  expect(html).not.toContain('data-platform-mode="ramaldi"');
  const preview = await request.get("/admin/plataforma/vista-previa");
  expect(preview.url()).toContain("/admin/login");
});
test("administrador personal conserva el panel y no recibe control de identidad", async ({
  page,
}) => {
  await login(page, "legacy");
  await expect(
    page.getByRole("link", { name: "Mi página web", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Configuración avanzada de plataforma",
      exact: true,
    }),
  ).toHaveCount(0);
  expect((await page.request.get("/admin/plataforma")).status()).toBe(404);
  expect(
    (
      await page.request.get("/api/admin/platform?kind=impact&target=ramaldi")
    ).status(),
  ).toBe(403);
  expect(
    (
      await action(page, {
        action: "mode",
        target: "ramaldi",
        revision: 0,
        confirmation: "CAMBIAR A RAMALDI",
        superadmin: true,
      })
    ).status(),
  ).toBe(403);
  await page.goto("/admin/web");
  await expect(
    page.getByRole("heading", { name: "Mi página web", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Primera línea del título", { exact: true }),
  ).toBeVisible();
});
test("cuenta pendiente: solo solicitud, sin inventario ni herramientas de publicación", async ({
  page,
}) => {
  await login(page, "pending");
  await expect(
    page.getByRole("heading", { name: "Mi solicitud", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Nueva propiedad empresarial" }),
  ).toHaveCount(0);
  const data = await (await page.request.get("/api/admin/platform")).json();
  expect(data.properties).toBeUndefined();
  expect(data.access.canWork).toBe(false);
  expect(
    (
      await action(page, {
        action: "profile",
        slug: "fraude",
        content: {},
        revision: 0,
        submit: false,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await action(page, {
        action: "member",
        userId: ids.pending.id,
        status: "active",
        role: "business_admin",
        note: "",
        revision: 0,
      })
    ).status(),
  ).toBe(403);
  await page
    .getByLabel("Nombre profesional", { exact: true })
    .fill("Solicitante de prueba");
  await page
    .getByRole("button", { name: "Completar solicitud", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Cambios guardados.");
});
test("SUPERADMIN: vista previa autenticada de PC y móvil no cambia la web ni inventa empleados", async ({
  page,
}) => {
  await login(page, "super");
  await page.goto("/admin/plataforma");
  await expect(
    page.getByRole("heading", {
      name: "Configuración avanzada de plataforma",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirmar cambio público", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("link", {
      name: "Vista previa empresarial privada",
      exact: true,
    })
    .click();
  const frame = page.frameLocator("iframe");
  await expect(
    frame.getByRole("heading", {
      name: "Presentación empresarial pendiente de aprobación",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    frame.getByText("Todavía no hay perfiles profesionales publicados.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Móvil", exact: true }).click();
  expect(
    await page
      .locator("iframe")
      .evaluate((el) => Math.round(el.getBoundingClientRect().width)),
  ).toBe(390);
  expect(
    await frame.locator("body").evaluate((el) => el.scrollWidth > innerWidth),
  ).toBe(false);
  const publicHTML = await (await page.request.get("/")).text();
  expect(publicHTML).toContain("THONY PAULINO");
  expect(publicHTML).not.toContain('data-platform-mode="ramaldi"');
  expect((await state(page)).mode.active_mode).toBe("thony");
});
test("cambio exige permisos, aprobación, configuración y confirmación; rechaza otro origen", async ({
  page,
}) => {
  await login(page, "super");
  expect(
    (
      await action(page, {
        action: "mode",
        target: "ramaldi",
        revision: 0,
        confirmation: "CAMBIAR A RAMALDI",
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await action(page, {
        action: "mode",
        target: "ramaldi",
        revision: 0,
        confirmation: "",
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await page.request.post("/api/admin/platform", {
        headers: { Origin: "https://other.example.test" },
        data: {
          action: "authorization",
          reference: "Aprobación falsa desde otro origen",
          confirm: true,
          registration: false,
        },
      })
    ).status(),
  ).toBe(403);
  expect((await state(page)).modeAudit).toHaveLength(0);
});
test("activación y reversión desde el panel: identidad, contactos, SEO, caché y pestaña abierta coherentes", async ({
  page,
  browser,
}) => {
  await login(page, "super");
  await page.request.post(`${fixture}/__test/prepare`, { data: {} });
  await page.goto("/admin/plataforma");
  const visitor = await browser.newPage();
  try {
    await visitor.goto("http://127.0.0.1:3400/");
    await expect(visitor.locator("#hero-title")).toBeVisible();
    await page
      .getByLabel("Para confirmar, escribe CAMBIAR A RAMALDI", { exact: true })
      .fill("CAMBIAR A RAMALDI");
    await page
      .getByRole("button", { name: "Confirmar cambio público", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Modalidad actualizada",
    );
    await visitor.evaluate(() => window.dispatchEvent(new Event("pageshow")));
    await expect(
      visitor.locator('[data-platform-mode="ramaldi"]'),
    ).toBeVisible();
    await expect(visitor).toHaveTitle("Portal empresarial de pruebas");
    await expect(visitor.locator("body")).not.toContainText(
      "brokerthonypaulino",
    );
    await expect(
      visitor.getByRole("link", { name: "empresa@example.test" }),
    ).toBeVisible();
    const identity = await page.request.get("/api/platform/identity");
    expect(identity.headers()["cache-control"]).toBe("no-store");
    expect((await identity.json()).mode).toBe("ramaldi");
    expect(await (await page.request.get("/sitemap.xml")).text()).toContain(
      "/asesores",
    );
    await visitor
      .getByRole("link", { name: "Nuestros asesores", exact: true })
      .click();
    await expect(
      visitor.getByRole("heading", { name: "Nuestros asesores", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Nueva modalidad", exact: true })
      .selectOption("thony");
    await page
      .getByLabel("Para confirmar, escribe CAMBIAR A THONY", { exact: true })
      .fill("CAMBIAR A THONY");
    await page
      .getByRole("button", { name: "Confirmar cambio público", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Modalidad actualizada",
    );
    await visitor.goto("http://127.0.0.1:3400/");
    await expect(visitor.locator("#hero-title")).toBeVisible();
    const after = await state(page);
    expect(after.modeAudit).toHaveLength(2);
    expect(after.mode.active_mode).toBe("thony");
  } finally {
    await visitor.close();
  }
});
test("el editor existente permite la identidad empresarial con permisos separados y navegación propia", async ({
  page,
  browser,
}) => {
  await login(page, "admin");
  await page.goto("/admin/web?mode=ramaldi");
  await expect(
    page.getByRole("heading", { name: "Mi página web · Ramaldi", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Navegación · Propiedades", { exact: true })
    .fill("Catálogo empresarial");
  await page
    .getByRole("button", { name: "Guardar borrador empresarial", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Borrador empresarial guardado",
  );
  const editor = await (
    await page.request.get("/api/admin/platform?kind=editor")
  ).json();
  expect(editor.settings.navProperties).toBe("Catálogo empresarial");
  expect(editor.settings.email).toBe("");
  expect(await (await page.request.get("/")).text()).not.toContain(
    "Catálogo empresarial",
  );
  const bad = await action(page, {
    action: "settings",
    content: { ...editor.settings, background: "#FFFFFF" },
    revision: editor.revision,
    publish: false,
  });
  expect(bad.status()).toBe(400);
  expect((await bad.json()).error).toContain("fondo oscuro");
  const legacy = await browser.newPage();
  try {
    await login(legacy, "legacy");
    expect(
      (
        await legacy.request.get("http://127.0.0.1:3400/admin/web?mode=ramaldi")
      ).status(),
    ).toBe(404);
    expect(
      (
        await legacy.request.get(
          "http://127.0.0.1:3400/api/admin/platform?kind=editor",
        )
      ).status(),
    ).toBe(403);
  } finally {
    await legacy.close();
  }
});
test("administración empresarial puede preparar configuración separada, pero no activar ni previsualizar la identidad privada", async ({
  page,
}) => {
  await login(page, "admin");
  await expect(
    page.getByRole("link", {
      name: "Configuración avanzada de plataforma",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(
    (await page.request.get("/admin/plataforma/vista-previa")).status(),
  ).toBe(404);
  const before = await (await page.request.get("/")).text();
  await page
    .getByLabel("Título de portada empresarial", { exact: true })
    .fill("Nuevo borrador corporativo privado");
  await page
    .getByRole("button", { name: "Guardar borrador empresarial", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Cambios guardados.");
  const after = await (await page.request.get("/")).text();
  expect(before).toContain("Tu próximo espacio.");
  expect(after).toContain("Tu próximo espacio.");
  expect(after).not.toContain("Nuevo borrador corporativo privado");
  expect(
    (
      await action(page, {
        action: "mode",
        target: "ramaldi",
        revision: 0,
        confirmation: "CAMBIAR A RAMALDI",
      })
    ).status(),
  ).toBe(403);
});
test("invitación cerrada mientras Thony está activo; recuperación no enumera cuentas", async ({
  page,
}) => {
  await login(page, "admin");
  const invitation = await (
    await action(page, { action: "invite", email: "invited@example.test" })
  ).json();
  expect(invitation.invitationPath).toMatch(/#invitacion=[a-f0-9]{64}$/);
  const result = await page.request.post("/api/platform/account", {
    headers: { Origin: "http://127.0.0.1:3400" },
    data: {
      action: "signup",
      email: "invited@example.test",
      password: "isolated-password",
      token: invitation.invitationPath.split("=")[1],
      captchaToken: "isolated-captcha-token",
    },
  });
  expect(result.status()).toBe(403);
  expect((await state(page)).signups).toBe(0);
  await page.goto("/admin/recuperar");
  await page
    .getByLabel("Correo profesional", { exact: true })
    .fill("unknown@example.test");
  await page
    .getByRole("button", { name: "Solicitar recuperación", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Si el correo corresponde a una cuenta",
  );
  expect((await state(page)).recoveries).toBe(1);
});
test("invitación, CAPTCHA, correo verificado y solicitud pendiente; pertenencia aprobada por otra cuenta", async ({
  page,
  browser,
}) => {
  await login(page, "super");
  await activate(page, true);
  const admin = await browser.newPage();
  const invited = await browser.newPage();
  try {
    await login(admin, "admin");
    const invitation = await (
      await action(admin, { action: "invite", email: "invited@example.test" })
    ).json();
    const token = invitation.invitationPath.split("=")[1];
    const input = {
      action: "signup",
      email: "invited@example.test",
      password: "isolated-password",
      token,
    };
    expect(
      (
        await page.request.post("/api/platform/account", {
          headers: { Origin: "http://127.0.0.1:3400" },
          data: input,
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await page.request.post(`${fixture}/auth/v1/signup`, {
          data: {
            email: "intruso@ramaldigroup.com",
            password: "isolated-password",
            data: { role: "business_admin" },
            gotrue_meta_security: { captcha_token: "isolated-captcha-token" },
          },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await page.request.post("/api/platform/account", {
          headers: { Origin: "http://127.0.0.1:3400" },
          data: { ...input, captchaToken: "isolated-captcha-token" },
        })
      ).status(),
    ).toBe(200);
    await login(invited, "invited");
    const accepted = await invited.request.post(
      "http://127.0.0.1:3400/api/platform/account",
      {
        headers: { Origin: "http://127.0.0.1:3400" },
        data: {
          action: "accept",
          email: "invited@example.test",
          token,
          name: "Invitado de prueba",
          description: "Solicitud aislada",
        },
      },
    );
    expect(accepted.status()).toBe(200);
    let access = await (
      await invited.request.get("http://127.0.0.1:3400/api/admin/platform")
    ).json();
    expect(access.access.status).toBe("pending");
    expect(access.properties).toBeUndefined();
    expect(
      (
        await action(admin, {
          action: "member",
          userId: ids.invited.id,
          status: "active",
          role: "agent",
          note: "Vínculo verificado en pruebas",
          revision: 0,
        })
      ).status(),
    ).toBe(200);
    access = await (
      await invited.request.get("http://127.0.0.1:3400/api/admin/platform")
    ).json();
    expect(access.access.canWork).toBe(true);
    expect(access.access.superadmin).toBe(false);
  } finally {
    await admin.close();
    await invited.close();
  }
});
test("borrador propio, fotos privadas, perfil aprobado, revisión y publicación; edición obliga a revisar otra vez", async ({
  page,
  browser,
}) => {
  await login(page, "super");
  await activate(page);
  const agent = await browser.newPage();
  const reviewer = await browser.newPage();
  try {
    await login(agent, "agent");
    await agent.goto("http://127.0.0.1:3400/admin/empresa/nueva");
    await agent
      .getByLabel("Nombre de la propiedad", { exact: true })
      .fill("Apartamento de prueba aislado");
    await agent
      .getByRole("button", { name: "Guardar borrador", exact: true })
      .click();
    await expect(agent).toHaveURL(/\/admin\/empresa$/);
    let row = (await state(page)).properties[0];
    expect(row.workflow_state).toBe("draft");
    expect(row.published).toBe(false);
    const id = row.id;
    await agent.goto(`http://127.0.0.1:3400/admin/empresa/propiedades/${id}`);
    await agent.getByLabel("Precio (USD)", { exact: true }).fill("1500");
    await agent
      .getByLabel("El precio es provisional", { exact: false })
      .uncheck();
    await agent.getByLabel("Ciudad o zona", { exact: false }).fill("Santiago");
    await agent
      .getByLabel("Referencia interna", { exact: false })
      .fill("TEST-001");
    await agent
      .getByLabel("Descripción", { exact: true })
      .fill("Descripción verificada exclusivamente para pruebas aisladas.");
    await agent.getByLabel("Añadir fotos", { exact: true }).setInputFiles({
      name: "foto.jpg",
      mimeType: "image/jpeg",
      buffer: jpeg,
    });
    await expect(agent.getByLabel("Descripción de la foto 1")).toBeVisible();
    await agent
      .getByLabel("Descripción de la foto 1")
      .fill("Fotografía de pruebas");
    await agent
      .getByRole("button", { name: "Guardar borrador", exact: true })
      .click();
    await expect(agent).toHaveURL(/\/admin\/empresa$/);
    row = (await state(page)).properties[0];
    const photo = row.images[0].path;
    expect(
      (
        await page.request.get(`/api/platform/media/${photo.slice(9)}`)
      ).status(),
    ).toBe(200);
    const anonymous = await browser.newContext();
    try {
      expect(
        (
          await anonymous.request.get(
            `http://127.0.0.1:3400/api/platform/media/${photo.slice(9)}`,
          )
        ).status(),
      ).toBe(404);
    } finally {
      await anonymous.close();
    }
    const profile = {
      name: "Asesor de pruebas",
      photo,
      role: "Asesor verificado en pruebas",
      description: "Perfil autorizado de prueba aislada",
      phone: "18095550000",
      whatsapp: "18095550000",
      email: "agent@example.test",
      instagram: "",
      specialties: "Santiago",
    };
    expect(
      (
        await action(agent, {
          action: "profile",
          slug: "asesor-pruebas",
          content: profile,
          revision: 0,
          submit: true,
        })
      ).status(),
    ).toBe(200);
    await login(reviewer, "admin");
    expect(
      (
        await action(reviewer, {
          action: "profileReview",
          userId: ids.agent.id,
          status: "published",
          note: "Perfil revisado",
          revision: 1,
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await action(agent, {
          action: "submitProperty",
          id,
          version: row.version,
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await action(agent, {
          action: "propertyReview",
          id,
          status: "published",
          note: "Manipulación",
          version: row.version + 1,
          thonyVisible: false,
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await action(reviewer, {
          action: "propertyReview",
          id,
          status: "published",
          note: "Salto de aprobación",
          version: row.version + 1,
          thonyVisible: false,
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await action(reviewer, {
          action: "propertyReview",
          id,
          status: "approved",
          note: "Datos verificados",
          version: row.version + 1,
          thonyVisible: false,
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await action(reviewer, {
          action: "propertyReview",
          id,
          status: "published",
          note: "Publicada",
          version: row.version + 2,
          thonyVisible: false,
        })
      ).status(),
    ).toBe(200);
    await page.goto(`/propiedades/${row.slug}`);
    await expect(
      page.getByRole("heading", {
        name: "Apartamento de prueba aislado",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ver perfil profesional", exact: false }),
    ).toBeVisible();
    expect(await (await page.request.get("/sitemap.xml")).text()).toContain(
      row.slug,
    );
    const personalAdmin = await browser.newPage();
    try {
      await login(personalAdmin, "legacy");
      await personalAdmin.goto("http://127.0.0.1:3400/admin/vista-previa");
      await expect(personalAdmin.locator("#hero-title")).toContainText(
        "Tu próximo espacio.",
      );
      await expect(
        personalAdmin.getByText("Apartamento de prueba aislado", {
          exact: true,
        }),
      ).toHaveCount(0);
    } finally {
      await personalAdmin.close();
    }
    await agent.goto(`http://127.0.0.1:3400/admin/empresa/propiedades/${id}`);
    await agent
      .getByLabel("Nombre de la propiedad", { exact: true })
      .fill("Edición aún privada");
    await agent
      .getByRole("button", { name: "Guardar borrador", exact: true })
      .click();
    await expect(agent).toHaveURL(/\/admin\/empresa$/);
    expect((await page.request.get(`/propiedades/${row.slug}`)).status()).toBe(
      404,
    );
  } finally {
    await agent.close();
    await reviewer.close();
  }
});
test("acceso entre asesores y almacenamiento: ni ficha ajena, ni rutas privadas, ni subida para otro UID", async ({
  page,
  browser,
}) => {
  await login(page, "super");
  await activate(page);
  const agent = await browser.newPage();
  const other = await browser.newPage();
  try {
    await login(agent, "agent");
    const uploaded = await agent.request.post(
      "http://127.0.0.1:3400/api/admin/media?scope=enterprise",
      {
        headers: { Origin: "http://127.0.0.1:3400" },
        multipart: {
          file: { name: "propia.jpg", mimeType: "image/jpeg", buffer: jpeg },
        },
      },
    );
    expect(uploaded.status()).toBe(201);
    const media = await uploaded.json();
    expect(media.path).toContain(ids.agent.id);
    await login(other, "other");
    expect(
      (
        await other.request.get(
          `http://127.0.0.1:3400/api/platform/media/${media.path.slice(9)}`,
        )
      ).status(),
    ).toBe(404);
    expect(
      (
        await other.request.get("http://127.0.0.1:3400/api/admin/media")
      ).status(),
    ).toBe(403);
    expect(
      (
        await action(other, {
          action: "member",
          userId: ids.other.id,
          status: "active",
          role: "business_admin",
          note: "",
          revision: 0,
        })
      ).status(),
    ).toBe(403);
    const direct = await other.request.get(
      "http://127.0.0.1:3400/admin/plataforma",
    );
    expect(direct.status()).toBe(404);
  } finally {
    await agent.close();
    await other.close();
  }
});
test("editor y vista previa empresarial mantienen móvil sin overflow y accesibilidad automática", async ({
  page,
}) => {
  await login(page, "super");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/plataforma");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  const audit = await new AxeBuilder({ page }).include("main").analyze();
  expect(audit.violations.map((v) => v.id)).toEqual([]);
  await page.screenshot({
    path: "test-results/platform-settings-mobile.png",
    fullPage: true,
  });
  await page.goto("/admin/plataforma/vista-previa/contenido");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await expect(
    page.getByRole("navigation", { name: "Navegación empresarial" }),
  ).toBeVisible();
});

test("documentación privada desde el panel: adjuntar exige propiedad propia y no publica el archivo", async ({
  page,
  browser,
}) => {
  await login(page, "super");
  await activate(page);
  const agent = await browser.newPage();
  try {
    await login(agent, "agent");
    await agent.goto("http://127.0.0.1:3400/admin/empresa/nueva");
    await agent
      .getByLabel("Nombre de la propiedad", { exact: true })
      .fill("Ficha privada con documentación");
    await agent
      .getByRole("button", { name: "Guardar borrador", exact: true })
      .click();
    await expect(agent).toHaveURL(/\/admin\/empresa$/);
    await agent.getByText("Planos y documentación", { exact: true }).click();
    await agent
      .getByLabel("Subir plano o documento PDF", { exact: true })
      .setInputFiles({
        name: "documento.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.7\nDocumento de pruebas aisladas\n%%EOF"),
      });
    await agent
      .getByLabel("Nombre del documento", { exact: true })
      .fill("Documento privado de prueba");
    await expect(
      agent.getByRole("button", { name: "Adjuntar al borrador", exact: true }),
    ).toBeEnabled();
    await agent
      .getByRole("button", { name: "Adjuntar al borrador", exact: true })
      .click();
    await expect(
      agent.getByRole("link", {
        name: "Documento privado de prueba",
        exact: true,
      }),
    ).toBeVisible();
    const workspace = await (
      await agent.request.get("http://127.0.0.1:3400/api/admin/platform")
    ).json();
    expect(workspace.documents).toHaveLength(1);
    expect(workspace.documents[0].public_on_publication).toBe(false);
    expect(workspace.properties[0].published).toBe(false);
    const visitor = await browser.newContext();
    try {
      expect(
        (
          await visitor.request.get(
            `http://127.0.0.1:3400/api/platform/media/${workspace.documents[0].path.slice(9)}`,
          )
        ).status(),
      ).toBe(404);
    } finally {
      await visitor.close();
    }
  } finally {
    await agent.close();
  }
});
test("conflicto de configuración mantiene la edición local y su copia descargable", async ({
  page,
}) => {
  await login(page, "admin");
  await page
    .getByLabel("Título de portada empresarial", { exact: true })
    .fill("Mi edición pendiente");
  const current = await (await page.request.get("/api/admin/platform")).json();
  expect(
    (
      await action(page, {
        action: "settings",
        content: { ...current.settings.draft, headline: "Edición concurrente" },
        revision: 0,
        publish: false,
      })
    ).status(),
  ).toBe(200);
  await page
    .getByRole("button", { name: "Guardar borrador empresarial", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Otra sesión cambió");
  await expect(
    page.getByLabel("Título de portada empresarial", { exact: true }),
  ).toHaveValue("Mi edición pendiente");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Descargar mi edición", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("borrador-ramaldi.json");
});
test("la reversión administrativa funciona incluso si el contenido público está dañado", async ({
  page,
}) => {
  await login(page, "super");
  await activate(page);
  await page.request.post(`${fixture}/__test/break-config`);
  expect((await page.request.get("/")).status()).toBe(500);
  await page.goto("/admin/plataforma");
  await expect(
    page.getByRole("heading", {
      name: "Configuración avanzada de plataforma",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Nueva modalidad", exact: true })
    .selectOption("thony");
  await page
    .getByLabel("Para confirmar, escribe CAMBIAR A THONY", { exact: true })
    .fill("CAMBIAR A THONY");
  await page
    .getByRole("button", { name: "Confirmar cambio público", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Modalidad actualizada");
  await page.goto("/");
  await expect(page.locator("#hero-title")).toBeVisible();
});
test("recuperación: enlace verificado, cambio de contraseña, cierre de sesión y rechazo de enlaces vencidos", async ({
  page,
  request,
}) => {
  expect(
    (
      await request.post("/api/platform/account", {
        headers: { Origin: "http://127.0.0.1:3400" },
        data: { action: "password", password: "new-isolated-password" },
      })
    ).status(),
  ).toBe(401);
  await page.goto(
    "/auth/confirm?token_hash=isolated-recovery-token&type=recovery&next=https://other.example.test",
  );
  await expect(page).toHaveURL(/\/admin\/cuenta$/);
  await page
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("new-isolated-password");
  await page
    .getByRole("button", { name: "Guardar nueva contraseña", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Contraseña actualizada",
  );
  expect((await page.request.get("/api/admin/platform")).status()).toBe(401);
  expect((await state(page)).passwordUpdates).toBe(1);
  await page.goto("/auth/confirm?token_hash=expired&type=recovery");
  await expect(page).toHaveURL(/\/admin\/recuperar\?enlace=invalid$/);
});
