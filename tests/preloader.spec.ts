import { expect, test, type Page } from "@playwright/test";

async function holdHero(page: Page, fail = false) {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route((url) =>
    // El recurso crítico de la portada es ahora el retrato autorizado.
    /\/thony-paulino\.[^/]+\.jpg$/.test(url.searchParams.get("url") || url.pathname),
  async (route) => {
    await pending;
    if (fail) await route.abort("failed");
    else await route.continue();
  });
  return release;
}

test("entrar por una ficha y volver por SPA no activa la introducción", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/propiedades/alberobello-residences");
  await expect(page.locator(".preloader")).toHaveCount(0);
  await page.evaluate(() => {
    new MutationObserver((records) => {
      if (records.some((record) => Array.from(record.addedNodes).some((node) =>
        node instanceof Element && (node.matches(".preloader") || node.querySelector(".preloader")),
      ))) document.documentElement.dataset.entryUnexpected = "true";
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page.getByRole("link", { name: "Volver a propiedades" }).click();
  await expect(page).toHaveURL(/\/#propiedades$/);
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator(".preloader")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-entry-unexpected", "true");
});

test("una carga lenta mantiene solo la respiración de la línea hasta decodificar el hero", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const release = await holdHero(page);
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const entry = page.locator(".preloader");
    await expect(entry).toBeVisible();
    await expect(entry).toHaveAttribute("data-phase", "waiting", { timeout: 3500 });
    await expect(entry.locator(".entry-brand")).toHaveText("THONY PAULINO");
    expect(await entry.locator(".entry-line").evaluate((node) => getComputedStyle(node).animationName))
      .toBe("entry-breathe");
    expect(await entry.locator(".entry-door").evaluate((node) => getComputedStyle(node).animationIterationCount))
      .toBe("1");
    release();
    await expect(entry).toHaveCount(0, { timeout: 2500 });
    expect(await page.locator(".hero-image").evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
      .toBe(true);
    await expect(page.locator("#hero-title")).toBeVisible();
  } finally {
    release();
  }
});

test("una imagen crítica que falla permite salir de la espera", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const release = await holdHero(page, true);
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".preloader")).toHaveAttribute("data-phase", "waiting", { timeout: 3500 });
    release();
    await expect(page.locator(".preloader")).toHaveCount(0, { timeout: 2500 });
    await expect(page.locator("#hero-title")).toBeVisible();
  } finally {
    release();
  }
});

test("el límite de seguridad libera la página aunque el hero siga pendiente", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const release = await holdHero(page);
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".preloader")).toHaveAttribute("data-phase", "waiting", { timeout: 3500 });
    await expect(page.locator(".preloader")).toHaveCount(0, { timeout: 4500 });
    expect(await page.locator(".hero-image").evaluate((node: HTMLImageElement) => node.complete)).toBe(false);
    await expect(page.locator("#hero-title")).toBeVisible();
  } finally {
    release();
  }
});

test("interactuar con teclado cierra la introducción y mantiene la navegación", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".preloader")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(".preloader")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
});
