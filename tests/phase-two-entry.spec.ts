import { expect, test } from "@playwright/test";

test("el hero muestra solo el título y la navegación funciona sin JavaScript", async ({
  browser,
  baseURL,
}, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: {
      width: testInfo.project.name === "mobile" ? 390 : 1440,
      height: 900,
    },
  });
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/`);
    await expect(page.locator("#hero-title")).toBeVisible();
    // Sin nota de fotografía, firma ni enlaces sobre la portada.
    await expect(page.locator(".hero").getByRole("link")).toHaveCount(0);
    await expect(page.locator(".hero")).not.toContainText(
      /Fotografía ilustrativa|perspectiva personal|Asesoría inmobiliaria/i,
    );
    if (testInfo.project.name === "mobile") {
      const nav = page.getByRole("navigation", {
        name: "Navegación sin JavaScript",
      });
      await expect(nav.getByRole("link")).toHaveCount(4);
      await nav.getByRole("link", { name: "Contacto", exact: true }).click();
      await expect(page).toHaveURL(/#contacto$/);
      await expect(
        page.getByRole("button", { name: "Abrir menú" }),
      ).not.toBeVisible();
    }
  } finally {
    await context.close();
  }
});

test("la introducción sale de forma segura si el almacenamiento está bloqueado", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Unavailable", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Unavailable", "SecurityError");
    };
  });
  await page.goto("/");
  await expect(page.locator(".preloader")).toBeVisible();
  await expect(page.locator(".preloader")).toHaveCount(0, { timeout: 4000 });
  await expect(page.locator("#hero-title")).toBeVisible();
  await page.locator(".property-image-link").first().click();
  await page.getByRole("link", { name: "Volver a propiedades" }).click();
  await expect(page.locator(".preloader")).toHaveCount(0);
});

test("cambiar a movimiento reducido durante la introducción deja el hero visible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".preloader")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".preloader")).toHaveCount(0);
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator("#hero-title strong")).toBeVisible();
});

test("el cierre animado del menú libera fondo y foco sin enlaces residuales", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => sessionStorage.setItem("thony-entry", "seen"));
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Abrir menú" });
  await toggle.click();
  await expect(page.locator("main")).toHaveAttribute("inert", "");
  await page.keyboard.press("Tab");
  const nav = page.getByRole("navigation", { name: "Navegación móvil" });
  await expect(nav).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  await expect(page.locator("#mobile-navigation")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("");
});
