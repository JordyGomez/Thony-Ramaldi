import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("inicio, imágenes locales, contacto y ausencia de errores de aplicación", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Tu próximo espacio.",
  );
  await expect(page.locator(".property-card")).toHaveCount(7);
  await expect(
    page.locator('a[href="tel:+18294045770"]').first(),
  ).toBeVisible();
  await expect(
    page
      .locator('a[href="mailto:brokerthonypaulino@ramaldigroup.com"]')
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator('a[href="https://www.instagram.com/thonypaulino_ramaldi/"]')
      .first(),
  ).toBeVisible();
  // Thony no tiene Facebook: no debe aparecer ningún enlace ni marcador.
  await expect(page.getByText(/facebook/i)).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: "Thony Paulino, asesor inmobiliario de Ramaldi" }),
  ).toHaveCount(1);
  for (const image of await page.locator("main img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  expect(errors).toEqual([]);
});

test("filtros combinados, alquiler mensual, estado vacío y restablecimiento", async ({
  page,
}, testInfo) => {
  await page.goto("/#propiedades");
  if (testInfo.project.name === "mobile")
    await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByLabel("Tipo de propiedad").selectOption("Villa");
  await page.getByLabel("Operación", { exact: true }).selectOption("Venta");
  await page.getByLabel("Ubicación", { exact: true }).selectOption("Santiago");
  await page.getByLabel("Precio máximo (USD)").selectOption("400000");
  await page.getByLabel("Habitaciones", { exact: true }).selectOption("3");
  await expect(page.locator(".property-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Residencia Olivo" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await page.getByLabel("Operación", { exact: true }).selectOption("Alquiler");
  await expect(page.locator(".property-card")).toHaveCount(3);
  await page.getByLabel("Máximo USD / mes").selectOption("1500");
  await expect(page.locator(".property-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Apartamento Luz" }),
  ).toBeVisible();
  await page.getByLabel("Habitaciones", { exact: true }).selectOption("4");
  await expect(
    page.getByRole("heading", { name: "No hay coincidencias todavía." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpiar filtros" }).first().click();
  await expect(page.locator(".property-card")).toHaveCount(7);
  await page.getByRole("button", { name: /Destacadas/ }).click();
  await expect(page.locator(".property-card")).toHaveCount(4);
  await expect(page.getByRole("status")).toHaveText(
    "4 propiedades · 1 en preparación · 3 de demostración",
  );
});

test("cada tarjeta de demostración abre su ficha y conserva la advertencia de demostración", async ({
  page,
}) => {
  await page.goto("/");
  const cards = await page
    .getByRole("link", { name: /^Ver .*, demostración$/ })
    .evaluateAll((elements) => elements.map((e) => e.getAttribute("href")!));
  expect(cards).toHaveLength(6);
  for (const url of cards) {
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(page.locator(".demo-alert")).toContainText(
      "No representa una propiedad disponible",
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    const whatsapp = await page
      .getByRole("link", { name: "Consultar a Thony" })
      .getAttribute("href");
    const parsed = new URL(whatsapp!);
    expect(parsed.host).toBe("wa.me");
    expect(parsed.pathname).toBe("/18294045770");
    expect(parsed.searchParams.get("text")).toContain("ficha de demostración");
    expect(parsed.searchParams.get("text")).toContain("DEMO-00");
    expect(parsed.searchParams.get("text")).toContain(
      (await page.getByRole("heading", { level: 1 }).textContent())?.trim(),
    );
  }
  const missing = await page.goto("/propiedades/no-existe");
  expect(missing?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: /Este espacio/ }),
  ).toBeVisible();
});

test("galería, miniaturas, ampliación y teclado", async ({ page }) => {
  await page.goto("/propiedades/residencia-patio");
  await page.getByRole("button", { name: "Imagen siguiente" }).click();
  await expect(page.locator(".gallery-counter")).toHaveText("2 / 3");
  await page.getByRole("button", { name: "Ver imagen 3" }).click();
  await expect(page.locator(".gallery-counter")).toHaveText("3 / 3");
  await page.getByRole("button", { name: "Ampliar galería" }).click();
  const dialog = page.getByRole("dialog", { name: "Galería ampliada" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.locator("p")).toContainText("1 / 3");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ampliar galería" }),
  ).toBeFocused();
});

test("navegación completa, Escape, foco y anclas", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Abrir menú" });
  await toggle.click();
  const nav = page.getByRole("navigation", { name: "Navegación móvil" });
  await expect(nav).toBeVisible();
  await expect(page.locator("#mobile-navigation")).toHaveCSS("position", "fixed");
  await expect(nav.getByRole("link", { name: /Contacto/ })).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(nav).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await nav.getByRole("link", { name: /Sobre Thony/ }).click();
  await expect(nav).not.toBeVisible();
  await expect(page).toHaveURL(/#sobre-thony$/);
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("");
});

test("sin desbordamiento horizontal en móvil, tablet, escritorio y horizontal", async ({
  page,
}) => {
  for (const width of [360, 390, 768, 844, 1440]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
    for (const url of ["/", "/propiedades/apartamento-brisa", "/propiedades/alberobello-residences"]) {
      await page.goto(url);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test("accesibilidad automática de inicio, ficha y menú abierto", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const home = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(home.violations).toEqual([]);
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const menu = await new AxeBuilder({ page })
      .include(".site-header")
      .include("#mobile-navigation")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(menu.violations).toEqual([]);
  }
  await page.goto("/propiedades/residencia-patio");
  const detail = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(detail.violations).toEqual([]);
});

test("la portada aparece sin introducción al abrir y recargar", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".preloader")).toHaveCount(0, { timeout: 4000 });
  await page.reload();
  await expect(page.locator(".preloader")).toHaveCount(0);
  await page.evaluate(() => sessionStorage.clear());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".preloader")).toHaveCount(0);
});

test("contenido disponible sin JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".property-card")).toHaveCount(7);
  await expect(page.locator(".preloader")).toHaveCount(0);
  await context.close();
});
