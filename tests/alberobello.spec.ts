import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const detailPath = "/propiedades/alberobello-residences";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("el catálogo distingue la ficha real en preparación y conserva las seis demostraciones", async ({ page }) => {
  await page.goto("/#propiedades");
  const catalog = page.locator("#propiedades");
  await expect(catalog.locator(".property-card")).toHaveCount(7);
  await expect(catalog.getByRole("status")).toHaveText(
    "7 propiedades · 1 en preparación · 6 de demostración",
  );
  await expect(catalog.locator(".demo-badge").filter({ hasText: /^Demostración$/ })).toHaveCount(6);
  const firstCard = catalog.locator(".property-card").first();
  await expect(firstCard.getByRole("heading")).toHaveText("Alberobello Residences");
  await expect(firstCard.getByText("Ficha en preparación", { exact: true })).toBeVisible();
  await expect(firstCard.getByText("Renta provisional · por confirmar")).toBeVisible();
  await expect(firstCard.getByText("Unidad por confirmar")).toBeVisible();
  await expect(firstCard.locator(".property-specs")).not.toContainText(/115|173|null/);

  const real = catalog.getByRole("button", { name: "Reales", exact: true });
  await real.click();
  await expect(real).toHaveAttribute("aria-pressed", "true");
  await expect(catalog.locator(".property-card")).toHaveCount(1);
  await expect(catalog.getByRole("status")).toHaveText("1 propiedad · 1 en preparación");
  await expect(firstCard.getByRole("link", { name: "Detalles de Alberobello Residences" })).toHaveAttribute("href", detailPath);
  await catalog.getByRole("button", { name: "Quitar selección de propiedades reales" }).click();
  await expect(catalog.getByRole("button", { name: "Todas las propiedades", exact: true })).toBeFocused();
  await expect(catalog.locator(".property-card")).toHaveCount(7);
});

test("el precio provisional y los datos desconocidos no se usan como valores confirmados en filtros", async ({ page }, testInfo) => {
  await page.goto("/#propiedades");
  const catalog = page.locator("#propiedades");
  if (testInfo.project.name === "mobile") {
    await catalog.getByRole("button", { name: "Filtros", exact: true }).click();
  }
  await catalog.getByRole("button", { name: "Reales", exact: true }).click();
  await page.getByLabel("Operación", { exact: true }).selectOption("Alquiler");
  await expect(catalog.locator(".property-card")).toHaveCount(1);
  await page.getByLabel("Máximo USD / mes").selectOption("1500");
  await expect(catalog.locator(".property-card")).toHaveCount(0);
  await expect(catalog.getByRole("heading", { name: "No hay coincidencias todavía." })).toBeVisible();
  await page.getByLabel("Máximo USD / mes").selectOption("");
  await page.getByLabel("Habitaciones", { exact: true }).selectOption("1");
  await expect(catalog.locator(".property-card")).toHaveCount(0);
  await catalog.getByRole("button", { name: "Limpiar filtros", exact: true }).first().click();
  await page.getByLabel("Habitaciones", { exact: true }).selectOption("1");
  await expect(catalog.locator(".property-card")).toHaveCount(6);
  await expect(catalog.getByRole("status")).toHaveText("6 propiedades de demostración");
});

test("la ficha separa los datos de la unidad de las tipologías y no indexa el borrador", async ({ page }) => {
  const response = await page.goto(detailPath);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Alberobello Residences en alquiler");
  await expect(page.locator(".demo-alert")).toHaveCount(0);
  const warning = page.getByRole("note").filter({ hasText: "FICHA EN PREPARACIÓN" });
  await expect(warning).toContainText("US$1,000 al mes es un precio provisional");
  await expect(warning).toContainText("no procede del folleto");
  await expect(warning).toContainText("no constituye una oferta comercial");
  await expect(page.locator(".detail-price")).toContainText("Renta provisional · por confirmar");
  await expect(page.locator(".detail-price")).toContainText("$1,000");
  const unit = page.locator(".detail-specs");
  await expect(unit.locator("strong")).toHaveText([
    "Por confirmar", "Por confirmar", "Por confirmar", "Por confirmar",
  ]);
  await expect(unit).not.toContainText(/115|173|null/);
  await expect(page.getByRole("heading", { name: "Tipologías del proyecto", exact: true })).toBeVisible();
  await expect(page.getByText("El folleto presenta estas opciones.", { exact: false })).toContainText(
    "No identifican la unidad que está alquilando Thony ni confirman su distribución o superficie.",
  );
  await expect(page.getByText(/^Apartamentos de 115 m²:/)).toBeVisible();
  await expect(page.getByText(/^Penthouses de 173 m²/)).toBeVisible();
  await expect(page.getByText(/su asignación e inclusión en la renta de esta unidad están por confirmar/)).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page).toHaveTitle(/Ficha en preparación/);
  await expect(page).not.toHaveTitle(/Demostración/);

  const contact = page.getByRole("link", { name: "Consultar a Thony", exact: true });
  const url = new URL((await contact.getAttribute("href"))!);
  expect(url.hostname).toBe("wa.me");
  expect(url.pathname).toBe("/18294045770");
  const message = url.searchParams.get("text")!;
  expect(message).toContain("Alberobello Residences (ALB-001)");
  expect(message).toContain("la renta mostrada es provisional");
  expect(message).toContain("confirmar el precio");
  expect(message).not.toContain("demostración");
});

test("los cuatro renders cargan con teclado y conservan su procedencia al ampliar", async ({ page }) => {
  await page.goto(detailPath);
  const gallery = page.getByRole("region", { name: "Galería de renders del proyecto", exact: true });
  await expect(gallery.locator(".gallery-main")).toContainText("Render del proyecto · Alberobello");
  await expect(gallery.locator(".gallery-note")).toContainText("Renders del proyecto · folleto original");
  await expect(gallery.locator(".gallery-note")).toContainText("No son fotografías de la unidad en alquiler");
  for (let index = 1; index <= 4; index += 1) {
    await expect(gallery.locator(".gallery-counter")).toHaveText(`${index} / 4`);
    const render = gallery.locator(".gallery-main img");
    await expect(render).toHaveCount(1);
    await expect(render).toHaveAttribute("alt", /^Render de.*Alberobello/);
    await expect.poll(() => render.evaluate((element: HTMLImageElement) =>
      element.complete && element.naturalWidth > 0,
    )).toBe(true);
    await gallery.focus();
    await page.keyboard.press("ArrowRight");
  }
  await expect(gallery.locator(".gallery-counter")).toHaveText("1 / 4");
  await gallery.getByRole("button", { name: "Ver imagen 4", exact: true }).click();
  await gallery.getByRole("button", { name: "Ampliar galería" }).click();
  const dialog = page.getByRole("dialog", { name: "Galería ampliada" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("p").last()).toHaveText("4 / 4 · Renders del proyecto");
  await page.keyboard.press("ArrowRight");
  await expect(dialog.locator("p").last()).toHaveText("1 / 4 · Renders del proyecto");
  await page.keyboard.press("Escape");
  await expect(gallery.getByRole("button", { name: "Ampliar galería" })).toBeFocused();
});

test("el enlace del folleto entrega el PDF original sin modificaciones", async ({ page, request }) => {
  await page.goto(detailPath);
  const brochure = page.getByRole("link", { name: /^Ver folleto original del proyecto/ });
  await expect(brochure).toBeVisible();
  await expect(brochure).toHaveAttribute("href", "/brochures/alberobello-brochure.pdf");
  const response = await request.get((await brochure.getAttribute("href"))!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  const body = await response.body();
  expect(body.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  // Digest del archivo Alberobello-Brochure.pdf entregado por el usuario.
  expect(createHash("sha256").update(body).digest("hex")).toBe(
    "185810f1a033cb4d1427e244a36f81c900d72ed9a0ac454b3e0e5bd5f6f016c2",
  );
});

test("sin JavaScript se abre la ficha real con renders originales, folleto y renta provisional", async ({ browser, baseURL, page }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: page.viewportSize()!,
  });
  const plainPage = await context.newPage();
  try {
    await plainPage.goto(`${baseURL}/#propiedades`);
    await expect(plainPage.locator("#propiedades .property-card")).toHaveCount(7);
    await plainPage.getByRole("link", { name: "Ver Alberobello Residences, ficha en preparación", exact: true }).click();
    await expect(plainPage).toHaveURL(new RegExp(`${detailPath}$`));
    await expect(plainPage.getByRole("heading", { level: 1 })).toHaveText("Alberobello Residences en alquiler");
    await expect(plainPage.locator(".detail-price")).toContainText("Renta provisional · por confirmar");
    await expect(plainPage.locator(".gallery-main img")).toBeVisible();
    await expect(plainPage.getByRole("link", { name: /^Ver render [1234]$/ })).toHaveCount(4);
    await expect(plainPage.getByRole("link", { name: /^Ver folleto original del proyecto/ })).toBeVisible();
    await expect(plainPage.getByRole("button", { name: "Ampliar galería" })).not.toBeVisible();
    const contact = plainPage.getByRole("link", { name: "Consultar a Thony", exact: true });
    expect(new URL((await contact.getAttribute("href"))!).searchParams.get("text")).toContain("la renta mostrada es provisional");
  } finally {
    await context.close();
  }
});

test("la nueva ficha mantiene accesibilidad automática y contacto móvil contextual", async ({ page }, testInfo) => {
  await page.goto(detailPath);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  const quickContact = page.getByRole("complementary", { name: "Consulta rápida de esta ficha" });
  if (testInfo.project.name === "mobile") {
    await expect(quickContact).toBeVisible();
    const link = quickContact.getByRole("link");
    await expect(link).toHaveAccessibleName(/Alberobello Residences.*alquiler por confirmar/);
    expect(new URL((await link.getAttribute("href"))!).searchParams.get("text")).not.toContain("demostración");
  } else {
    await expect(quickContact).not.toBeVisible();
  }
});
