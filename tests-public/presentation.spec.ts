import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("el menú ocupa la pantalla completa con animaciones, scroll y cambios de tamaño", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => sessionStorage.setItem("thony-entry", "seen"));
  await page.goto("/");
  await expect(page.locator(".preloader")).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Navegación sin JavaScript" }),
  ).not.toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 650, behavior: "instant" }));
  await expect(page.locator(".site-header")).toHaveClass(/is-scrolled/);
  const toggle = page.getByRole("button", { name: "Abrir menú" });
  await toggle.click();
  const panel = page.locator("#mobile-navigation");
  const links = panel.getByRole("navigation").getByRole("link");
  await expect(links).toHaveCount(4);
  for (const [width, height] of [
    [1600, 800],
    [1920, 1080],
    [1366, 768],
    [390, 844],
    [844, 390],
    [800, 450],
  ]) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(async () => {
        const box = await panel.boundingBox();
        return box && [box.x, box.y, box.width, box.height].map(Math.round);
      })
      .toEqual([0, 0, width, height]);
    for (const link of await links.all())
      await expect(link).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole("button", { name: "Cerrar menú" }),
    ).toBeInViewport();
    expect(
      await panel.evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await links.first().focus();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Cerrar menú" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(panel.getByRole("link", { name: "Contactar a Thony" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Cerrar menú" })).toBeFocused();
  expect(
    (await new AxeBuilder({ page })
      .include(".site-header")
      .include("#mobile-navigation")
      .analyze()).violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(toggle).toBeFocused();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("sin inventario, el pie espera fotografías de propiedades publicadas", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".property-card, .showcase-card")).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: /Pronto publicaremos nuevas propiedades/,
    }),
  ).toBeVisible();
  await expect(
    page
      .locator(".catalog-empty")
      .getByRole("link", { name: "Escribir a Thony" }),
  ).toHaveAttribute("href", /^https:\/\/wa\.me\/18294045770/);
  await expect(
    page.locator('.catalog-empty a[href="tel:+18294045770"]'),
  ).toBeVisible();
  await expect(page.locator(".hero-image")).toHaveAttribute("src", /portada/);
  await expect(
    page.locator(".hero .photo-note"),
  ).toHaveText("Fotografía ilustrativa");
  await expect(page.locator(".footer-image, .footer-photo")).toHaveCount(0);
  await expect(page.locator(".footer-wordmark")).toHaveText("THONY PAULINO");
  await expect(page.locator(".footer-socials")).toBeVisible();
  await expect(
    page.getByText(
      /Residencia Olivo|Apartamento Luz|Penthouse Horizonte|US\$1,000/,
    ),
  ).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("las fichas de pruebas no están disponibles en el sitio sin fixtures", async ({
  page,
}) => {
  const response = await page.goto("/propiedades/residencia-patio");
  expect(response?.status()).toBe(404);
});

test("el panel queda separado de la escena pública y conserva su entrada protegida", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(
    page.locator(".preloader, .site-header, .hero, .site-footer"),
  ).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  if (new URL(page.url()).pathname === "/admin/login") {
    await expect(
      page.getByRole("heading", { name: "Entrar", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Correo", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "pendiente de activar",
    );
  }
});
