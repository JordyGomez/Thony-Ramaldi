import { expect, test, type Page } from "@playwright/test";

async function holdHero(page: Page, fail = false) {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    (url) =>
      // El recurso crítico es la fotografía de portada elegida por Claude.
      /\/portada\.[^/]+\.jpg$/.test(
        url.searchParams.get("url") || url.pathname,
      ),
    async (route) => {
      await pending;
      if (fail) await route.abort("failed");
      else await route.continue();
    },
  );
  return release;
}

test("entrar por una ficha y volver por SPA no activa la introducción", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/propiedades/alberobello-residences");
  await expect(page.locator(".preloader")).toHaveCount(0);
  await page.evaluate(() => {
    new MutationObserver((records) => {
      if (
        records.some((record) =>
          Array.from(record.addedNodes).some(
            (node) =>
              node instanceof Element &&
              (node.matches(".preloader") || node.querySelector(".preloader")),
          ),
        )
      )
        document.documentElement.dataset.entryUnexpected = "true";
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page.getByRole("link", { name: "Volver a propiedades" }).click();
  await expect(page).toHaveURL(/\/#propiedades$/);
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator(".preloader")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-entry-unexpected",
    "true",
  );
});

test("una foto lenta no bloquea el menú ni el contenido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const release = await holdHero(page);
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".preloader")).toHaveCount(0);
    await expect(page.locator("#hero-title")).toBeVisible();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.locator("#mobile-navigation")).toBeVisible();
    await expect(page.locator("#mobile-navigation").getByRole("link", { name: /Contacto/ })).toBeInViewport();
  } finally {
    release();
  }
});

test("una foto que falla mantiene el contenido y los contactos disponibles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const release = await holdHero(page, true);
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    release();
    await expect(page.locator(".preloader")).toHaveCount(0);
    await expect(page.locator("#hero-title")).toBeVisible();
    await expect(page.locator('.hero a[href^="https://wa.me/"]')).toBeVisible();
  } finally {
    release();
  }
});

test("el resto de la página se puede usar mientras la portada sigue pendiente", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const release = await holdHero(page);
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("#sobre-thony").scrollIntoViewIfNeeded();
    await expect(page.locator("#sobre-thony")).toBeInViewport();
    expect(await page.locator(".hero-image").evaluate((image: HTMLImageElement) => image.complete)).toBe(false);
    await expect(page.locator(".preloader")).toHaveCount(0);
  } finally {
    release();
  }
});

test("el teclado accede al contenido sin pasar por una introducción", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".preloader")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
});
