import { expect, test } from "@playwright/test";

test("la entrada revela el retrato autorizado y entrega el control al hero", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const entry = page.locator(".preloader");
  await expect(entry).toBeVisible();
  await expect(entry.locator('[data-door-scene="entry"]')).toBeVisible();
  await expect(entry.locator(".entry-portrait")).toHaveAttribute("src", /thony-paulino/);
  await expect(entry.locator(".entry-brand")).toHaveText("THONY PAULINO");
  await expect(entry).toHaveCount(0, { timeout: 5500 });
  await expect(page.locator("html")).toHaveAttribute("data-entry-state", "revealed");
  await expect(page.getByRole("heading", { name: "Tu próximo espacio. Tu próxima historia." })).toBeVisible();
  await expect(page.locator(".hero-image")).toHaveAttribute("src", /thony-paulino/);
  await expect(page.locator('img[src*="portada"]')).toHaveCount(0);
});

test("la profundidad se desactiva fuera de pantalla y al reducir movimiento", async ({ page }, info) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("thony-entry", "seen");
    Object.defineProperty(navigator, "deviceMemory", { value: 8, configurable: true });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const scene = page.locator(".hero-architecture");
  if (info.project.name === "desktop") {
    await scene.hover();
    await expect(scene).toHaveAttribute("data-depth-active", "true");
    await page.locator("#sobre-thony").scrollIntoViewIfNeeded();
    await expect(scene).not.toHaveAttribute("data-depth-active", "true");
    await page.locator(".hero").scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute("data-depth-active", "true");
  } else {
    await expect(scene).not.toHaveAttribute("data-depth-active", "true");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene).not.toHaveAttribute("data-depth-active", "true");
  await expect(page.locator(".hero-portrait-plane")).toHaveCSS("transform", "none");
});

test("el ahorro de datos mantiene la composición estática", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("thony-entry", "seen");
    Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".hero-architecture")).not.toHaveAttribute("data-depth-active", "true");
  await expect(page.locator("#hero-title")).toBeVisible();
});
