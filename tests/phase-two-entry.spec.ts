import { expect, test } from "@playwright/test";

test("el hero conserva sus acciones y la navegación móvil sin JavaScript", async ({
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
    const explore = page
      .locator(".hero")
      .getByRole("link", { name: "Explorar propiedades" });
    await expect(explore).toBeVisible();
    await explore.click();
    await expect(page).toHaveURL(/#propiedades$/);
    const contact = page
      .locator(".hero")
      .getByRole("link", { name: "Hablar con Thony" });
    await expect(contact).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/18294045770\?text=/,
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

test("la puerta sale de forma segura si el almacenamiento está bloqueado", async ({
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
  await expect(page.locator("#hero-title > span")).toHaveCSS("opacity", "1");
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
  await expect(page.locator("#hero-title > span")).toHaveCSS("opacity", "1");
  await expect(page.locator("#hero-title > em")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
});

test("el cierre animado del menú libera fondo y foco sin enlaces residuales", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name !== "mobile") return;
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
