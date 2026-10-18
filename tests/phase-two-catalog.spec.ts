import { expect, test } from "@playwright/test";

type CatalogExitCheck = { hidden: boolean; focusBlocked: boolean };

declare global {
  interface Window {
    catalogExitChecks?: CatalogExitCheck[];
  }
}

test("los filtros activos se retiran con teclado y conservan el rango de operación", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#propiedades");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Filtros", exact: true }).click();
  }

  const operation = page.getByLabel("Operación", { exact: true });
  await operation.selectOption("Alquiler");
  await page.getByLabel("Máximo USD / mes").selectOption("1500");
  await expect(page.locator(".property-card")).toHaveCount(1);
  await expect(page.locator(".property-bottom")).toContainText("/ mes");
  await expect(page.locator(".property-card .demo-badge")).toHaveText("Demostración");

  const active = page.getByRole("group", { name: "Filtros activos", exact: true });
  await expect(active.getByRole("button")).toHaveCount(2);
  const removePrice = active.getByRole("button", { name: /Quitar filtro Hasta USD/ });
  await removePrice.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Máximo USD / mes")).toBeFocused();
  await expect(page.getByLabel("Máximo USD / mes")).toHaveValue("");
  await expect(operation).toHaveValue("Alquiler");
  await expect(page.locator(".property-card")).toHaveCount(3);

  await page.getByLabel("Máximo USD / mes").selectOption("2500");
  await active.getByRole("button", { name: "Quitar filtro Operación: Alquiler" }).click();
  await expect(operation).toBeFocused();
  await expect(operation).toHaveValue("");
  await expect(page.getByLabel("Precio máximo (USD)")).toHaveValue("");
  await expect(active).toHaveCount(0);
  await expect(page.locator(".property-card")).toHaveCount(7);

  if (testInfo.project.name === "mobile") {
    await page.getByLabel("Tipo de propiedad").selectOption("Villa");
    const toggle = page.getByRole("button", { name: "Filtros", exact: true });
    await toggle.click();
    await active.getByRole("button", { name: "Quitar filtro Tipo: Villa" }).click();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".property-card")).toHaveCount(7);
  }
});

test("las tarjetas que salen al filtrar dejan de recibir foco durante la transición", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#propiedades");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Filtros", exact: true }).click();
  }
  await page.evaluate(() => {
    const checks: CatalogExitCheck[] = [];
    window.catalogExitChecks = checks;
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const element = mutation.target;
        if (!(element instanceof HTMLElement) || element.dataset.present !== "false") continue;
        const link = element.querySelector("a");
        link?.focus({ preventScroll: true });
        checks.push({
          hidden: element.getAttribute("aria-hidden") === "true",
          focusBlocked: Boolean(link) && document.activeElement !== link,
        });
      }
    }).observe(document.querySelector("#propiedades .property-grid")!, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-present"],
    });
  });
  await page.getByLabel("Operación", { exact: true }).focus();
  await page.getByLabel("Operación", { exact: true }).selectOption("Alquiler");
  await expect(page.locator(".property-card")).toHaveCount(3);
  const checks = await page.evaluate(() => window.catalogExitChecks ?? []);
  expect(checks.length).toBeGreaterThan(0);
  expect(checks.every((check) => check.hidden && check.focusBlocked)).toBe(true);
  await expect(page.getByLabel("Operación", { exact: true })).toBeFocused();
});

test("sin JavaScript el catálogo completo permite abrir fichas y explica el filtrado", async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! });
  const plainPage = await context.newPage();
  await plainPage.goto("http://127.0.0.1:3100/#propiedades");
  const catalog = plainPage.locator("#propiedades");
  await expect(catalog.locator(".property-card")).toHaveCount(7);
  // Playwright's text engine skips noscript subtrees even when scripting is off.
  const explanation = catalog.locator("noscript p");
  await expect(explanation).toBeVisible();
  await expect(explanation).toContainText("Activa JavaScript para filtrar esta selección.");
  await expect(catalog.getByRole("combobox")).toHaveCount(0);
  await expect(catalog.getByRole("group", { name: "Selección de propiedades" })).toHaveCount(0);
  for (const card of await catalog.locator(".property-card").all()) {
    await expect(card).toBeVisible();
  }
  await catalog.getByRole("link", { name: "Ver Residencia Patio, demostración" }).click();
  await expect(plainPage).toHaveURL(/\/propiedades\/residencia-patio$/);
  await expect(plainPage.getByRole("heading", { level: 1 })).toHaveText("Residencia Patio");
  await context.close();
});
