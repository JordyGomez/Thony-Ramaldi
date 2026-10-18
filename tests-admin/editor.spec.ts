import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
const fixture = "http://127.0.0.1:3335";
const image = readFileSync("public/images/thony-paulino.jpg");

test.beforeEach(async ({ request, page }) => {
  await request.post(`${fixture}/__test/reset`);
  await page.emulateMedia({ reducedMotion: "reduce" });
  // El optimizador conserva la protección contra IP privadas. Solo en este
  // doble local las miniaturas se sirven con el JPEG conocido de la prueba.
  await page.route(
    (url) =>
      url.pathname === "/_next/image" &&
      Boolean(url.searchParams.get("url")?.startsWith(fixture)),
    (route) =>
      route.fulfill({ status: 200, contentType: "image/jpeg", body: image }),
  );
});
const login = async (page: import("@playwright/test").Page) => {
  await page.goto("/admin/login");
  await page.getByLabel("Correo", { exact: true }).fill("admin@example.test");
  await page.getByLabel("Contraseña").fill("local-test-password");
  await page
    .getByRole("button", { name: "Entrar al panel", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
};

test("las rutas de medios y edición rechazan visitas sin sesión", async ({
  request,
}) => {
  for (const path of ["media", "site", "health"]) {
    const response = await request.get(`/api/admin/${path}`);
    expect(response.status()).toBe(401);
  }
  const response = await request.post("/api/admin/media", {
    headers: { Origin: "http://127.0.0.1:3300" },
    multipart: {
      file: { name: "foto.jpg", mimeType: "image/jpeg", buffer: image },
    },
  });
  expect(response.status()).toBe(401);
});

test("la subida se autentica en el servidor y conserva el formulario ante un rechazo de permisos", async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto("/admin/nueva");
  await page.getByLabel("Nombre de la propiedad").fill("Mi apartamento");
  await request.post(`${fixture}/__test/state`, {
    data: { storageError: "permissions" },
  });
  await page.getByLabel("Añadir fotos", { exact: true }).setInputFiles({
    name: "foto-prueba.jpg",
    mimeType: "image/jpeg",
    buffer: image,
  });
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Supabase rechazó la subida por permisos",
  );
  await expect(page.getByLabel("Nombre de la propiedad")).toHaveValue(
    "Mi apartamento",
  );
  await request.post(`${fixture}/__test/state`, { data: { storageError: "" } });
  await page
    .getByRole("button", { name: "Reintentar foto-prueba.jpg" })
    .click();
  await expect(page.getByLabel("Descripción de la foto 1")).toBeVisible();
  const state = await (await request.get(`${fixture}/__test/state`)).json();
  expect(state.uploads).toBe(1);
  expect(state.files[0].mime).toBe("image/jpeg");
});

test("una sesión vencida produce un aviso de sesión y permite reintentar", async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto("/admin/nueva");
  await request.post(`${fixture}/__test/state`, { data: { expired: true } });
  await page.getByLabel("Añadir fotos", { exact: true }).setInputFiles({
    name: "sesion.jpg",
    mimeType: "image/jpeg",
    buffer: image,
  });
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Tu sesión terminó",
  );
  expect(
    (await (await request.get(`${fixture}/__test/state`)).json()).uploads,
  ).toBe(0);
});

test("una cuenta sin rol de administrador no puede subir ni publicar", async ({
  page,
  request,
}) => {
  await login(page);
  await request.post(`${fixture}/__test/state`, { data: { admin: false } });
  const response = await page.request.post("/api/admin/media", {
    headers: { Origin: "http://127.0.0.1:3300" },
    multipart: {
      file: { name: "foto.jpg", mimeType: "image/jpeg", buffer: image },
    },
  });
  expect(response.status()).toBe(403);
  expect((await response.json()).error).toContain(
    "no tiene permiso de administrador",
  );
  const save = await page.request.post("/api/admin/site", {
    headers: { Origin: "http://127.0.0.1:3300" },
    data: {},
  });
  expect(save.status()).toBe(403);
  await page.goto("/admin/web");
  await expect(
    page.getByRole("heading", { name: "Permiso de administración necesario" }),
  ).toBeVisible();
});

test("el servidor comprueba el contenido del archivo y bloquea peticiones desde otra web", async ({
  page,
}) => {
  await login(page);
  const invalid = await page.request.post("/api/admin/media", {
    headers: { Origin: "http://127.0.0.1:3300" },
    multipart: {
      file: {
        name: "foto.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("esto no es una foto"),
      },
    },
  });
  expect(invalid.status()).toBe(415);
  const crossOrigin = await page.request.post("/api/admin/media", {
    headers: { Origin: "https://otra-web.example" },
    multipart: {
      file: { name: "foto.jpg", mimeType: "image/jpeg", buffer: image },
    },
  });
  expect(crossOrigin.status()).toBe(403);
});

test("la configuración diagnostica permisos, almacenamiento y migración faltante", async ({
  page,
  request,
}) => {
  await login(page);
  await request.post(`${fixture}/__test/state`, {
    data: { installed: false, storageError: "bucket" },
  });
  await page.goto("/admin/configuracion");
  await expect(
    page.getByRole("heading", {
      name: "Almacenamiento de archivos · Requiere atención",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Editor de la web · Requiere atención" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Descargar configuración del editor" }),
  ).toHaveAttribute("href", "/api/admin/migration");
  await page.goto("/admin/web");
  await expect(
    page.getByRole("button", { name: "Publicar cambios" }),
  ).toBeDisabled();
  await expect(page.getByText("Activa el guardado del editor.")).toBeVisible();
});

test("la biblioteca reutiliza fotos y el panel se adapta a móvil", async ({
  page,
}) => {
  await login(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/archivos");
  await page.getByLabel("Añadir fotos", { exact: true }).setInputFiles({
    name: "biblioteca.jpg",
    mimeType: "image/jpeg",
    buffer: image,
  });
  await expect(
    page.getByRole("button", { name: "Copiar enlace" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page.goto("/admin/web");
  await page
    .getByRole("button", { name: "Imágenes y logo", exact: true })
    .click();
  await expect(page.getByText("Logo original", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Publicar cambios" }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("editar y guardar un borrador no publica; la vista previa recibe los cambios sin publicar", async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto("/admin/web");
  await page
    .getByLabel("Primera línea del título", { exact: true })
    .fill("Un lugar para tu nueva historia.");
  await page
    .getByRole("button", { name: "Guardar borrador", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Borrador guardado");
  let state = await (await request.get(`${fixture}/__test/state`)).json();
  expect(state.draft.content.texts.heroTitle).toBe(
    "Un lugar para tu nueva historia.",
  );
  expect(state.publication.content).toEqual({});
  await page.getByRole("button", { name: "Vista previa en vivo" }).click();
  await expect(
    page
      .frameLocator('iframe[title="Vista previa privada de la web"]')
      .locator("#hero-title"),
  ).toContainText("Un lugar para tu nueva historia.");
  await page
    .getByLabel("Primera línea del título", { exact: true })
    .fill("Una perspectiva todavía privada.");
  await expect(
    page
      .frameLocator('iframe[title="Vista previa privada de la web"]')
      .locator("#hero-title"),
  ).toContainText("Una perspectiva todavía privada.");
  state = await (await request.get(`${fixture}/__test/state`)).json();
  expect(state.draft.content.texts.heroTitle).toBe(
    "Un lugar para tu nueva historia.",
  );
  expect(state.publication.content).toEqual({});
});

test("un conflicto conserva la edición y no reemplaza la del otro colaborador", async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto("/admin/web");
  await page
    .getByLabel("Primera línea del título", { exact: true })
    .fill("Mi edición local.");
  await request.post(`${fixture}/__test/state`, {
    data: {
      draft: {
        id: 1,
        content: { texts: { heroTitle: "Edición de otro colaborador." } },
        revision: 1,
      },
    },
  });
  await page
    .getByRole("button", { name: "Guardar borrador", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Otra persona guardó cambios",
  );
  await expect(
    page.getByLabel("Primera línea del título", { exact: true }),
  ).toHaveValue("Mi edición local.");
  const state = await (await request.get(`${fixture}/__test/state`)).json();
  expect(state.draft.content.texts.heroTitle).toBe(
    "Edición de otro colaborador.",
  );
});

test("publicar actualiza portada, contactos, secciones, SEO y movimiento; guarda historial recuperable", async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto("/admin/web");
  await page
    .getByLabel("Primera línea del título", { exact: true })
    .fill("Encuentra tu nueva historia.");
  await page.getByText("Identidad y contacto", { exact: true }).click();
  await page
    .getByLabel("Teléfono como se muestra", { exact: true })
    .fill("809-555-0101");
  await page
    .getByLabel("Teléfono internacional, solo dígitos", { exact: true })
    .fill("18095550101");
  await page
    .getByLabel("WhatsApp internacional, solo dígitos", { exact: true })
    .fill("18095550101");
  await page.getByText("Buscadores y redes sociales", { exact: true }).click();
  await page
    .getByLabel("Título en buscadores", { exact: true })
    .fill("Thony · Tu búsqueda personal");
  await page
    .getByRole("button", { name: "Secciones y orden", exact: true })
    .click();
  await page.getByLabel("Búsqueda personal", { exact: true }).uncheck();
  await page
    .getByRole("button", { name: "Marca y animaciones", exact: true })
    .click();
  await page.getByLabel("Intensidad de las animaciones").selectOption("off");
  await page
    .getByRole("button", { name: "Publicar cambios", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Cambios publicados");
  const state = await (await request.get(`${fixture}/__test/state`)).json();
  expect(state.publication.content.texts.heroTitle).toBe(
    "Encuentra tu nueva historia.",
  );
  expect(state.history).toHaveLength(1);
  await page.goto("/");
  await expect(page.locator("#hero-title")).toContainText(
    "Encuentra tu nueva historia.",
  );
  await expect(page).toHaveTitle("Thony · Tu búsqueda personal");
  await expect(page.locator("#mi-proximo-espacio")).toHaveCount(0);
  await expect(page.locator(".site-experience")).toHaveAttribute(
    "data-motion",
    "off",
  );
  await expect(
    page.locator('#contacto .contact-details a[href^="tel:"]'),
  ).toHaveAttribute("href", "tel:+18095550101");
  await expect(page.locator(".floating-whatsapp")).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/18095550101/,
  );
  await page.goto("/admin/web");
  await page.getByRole("button", { name: "Historial", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Cargar versión 0" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cargar versión 0" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Versión 0 cargada para revisar",
  );
  expect(
    (await (await request.get(`${fixture}/__test/state`)).json()).publication
      .content.texts.heroTitle,
  ).toBe("Encuentra tu nueva historia.");
});

test("el editor rechaza enlaces inseguros, imágenes ajenas y colores ilegibles", async ({
  page,
}) => {
  await login(page);
  const initial = await (await page.request.get("/api/admin/site")).json();
  const cases = [
    {
      ...initial.settings,
      texts: { ...initial.settings.texts, instagram: "javascript:alert(1)" },
    },
    {
      ...initial.settings,
      assets: {
        ...initial.settings.assets,
        logo: "https://otra-web.example/logo.png",
      },
    },
    {
      ...initial.settings,
      theme: {
        ...initial.settings.theme,
        text: initial.settings.theme.background,
      },
    },
    {
      ...initial.settings,
      sections: initial.settings.sections.map(
        (section: { id: string; visible: boolean }) => ({
          ...section,
          id: "about",
        }),
      ),
    },
  ];
  for (const settings of cases) {
    const result = await page.request.post("/api/admin/site", {
      headers: { Origin: "http://127.0.0.1:3300" },
      data: { revision: 0, publish: true, settings },
    });
    expect(result.status()).toBe(400);
  }
});

test("publicar y borrar una ficha conserva sus fotos compartidas en la biblioteca", async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto("/");
  await expect(page.locator(".footer-image")).toHaveCount(0);
  await page.goto("/admin/nueva");
  await page
    .getByLabel("Nombre de la propiedad")
    .fill("Apartamento de prueba local");
  await page.getByLabel("Precio (USD)", { exact: true }).fill("125000");
  await page.getByLabel("Ciudad o zona").fill("Santiago");
  await page.getByLabel("Referencia interna").fill("TEST-001");
  await page
    .getByLabel("Descripción", { exact: true })
    .fill("Ficha utilizada exclusivamente por las pruebas locales del panel.");
  await page
    .getByLabel("Añadir fotos", { exact: true })
    .setInputFiles({
      name: "propiedad.jpg",
      mimeType: "image/jpeg",
      buffer: image,
    });
  await page
    .getByLabel("Descripción de la foto 1", { exact: true })
    .fill(
      "Retrato de prueba para comprobar la subida, sin oferta inmobiliaria real.",
    );
  await page
    .getByRole("button", { name: "Publicar propiedad", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.locator("main li").filter({ hasText: "Apartamento de prueba local" }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".footer-photo")).toBeVisible();
  await expect(page.locator(".footer-photo")).toHaveAttribute(
    "alt",
    "Retrato de prueba para comprobar la subida, sin oferta inmobiliaria real.",
  );
  await expect(page.locator(".footer-image .photo-note")).toHaveText(
    "Apartamento de prueba local",
  );
  await page.goto("/admin");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Borrar", exact: true }).click();
  await expect(
    page.locator("main li").filter({ hasText: "Apartamento de prueba local" }),
  ).toHaveCount(0);
  const state = await (await request.get(`${fixture}/__test/state`)).json();
  expect(state.propertyCount).toBe(0);
  expect(state.files).toHaveLength(1);
  expect(state.removals).toBe(0);
  await page.goto("/");
  await expect(page.locator(".footer-image")).toHaveCount(0);
});
