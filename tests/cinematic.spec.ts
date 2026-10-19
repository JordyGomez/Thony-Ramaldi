import { expect, test } from "@playwright/test";

test("la portada aparece directamente sin puerta ni introducción", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".preloader, [data-door-scene]")).toHaveCount(0);
  await expect(page.locator(".site-experience")).toHaveAttribute("data-motion", "off");
  await expect(page.getByRole("heading", { name: "Tu próximo espacio. Tu próxima historia." })).toBeVisible();
  await expect(page.locator(".hero-image")).toHaveAttribute("src", /portada/);
  await expect(page.locator(".hero .photo-note")).toHaveText("Fotografía ilustrativa");
});

test("fotos y controles permanecen estáticos al mover el puntero y desplazarse", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.mouse.move(120, 230);
  await expect(page.locator(".hero-depth-layer")).toHaveCSS("transform", "none");
  await expect(page.locator(".hero-image")).toHaveCSS("transform", "none");
  await page.locator("#sobre-thony").scrollIntoViewIfNeeded();
  await expect(page.locator('[data-depth-active="true"]')).toHaveCount(0);
  await page.locator(".button").first().hover();
  await expect(page.locator(".button").first()).toHaveCSS("transform", "none");
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length)).toBe(0);
});

test("el menú responde sin animación y conserva todas sus opciones", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  const menu = page.locator("#mobile-navigation");
  await expect(menu).toHaveCSS("animation-name", "none");
  await expect(menu.getByRole("navigation").getByRole("link")).toHaveCount(4);
  await expect(menu.getByRole("link", { name: /Contacto/ })).toBeInViewport();
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
});
