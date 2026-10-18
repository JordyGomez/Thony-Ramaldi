import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("galería normal con teclado, selección y una sola imagen activa", async ({ page }) => {
  await page.goto("/propiedades/residencia-patio");
  const gallery = page.getByRole("region", {
    name: "Galería de fotografías ilustrativas",
  });
  const firstAlt = await gallery.locator(".gallery-main img").getAttribute("alt");
  await gallery.focus();
  await page.keyboard.press("ArrowRight");
  await expect(gallery.locator(".gallery-counter")).toHaveText("2 / 3");
  await expect(gallery.locator(".gallery-main img")).toHaveCount(1);
  await expect(gallery.getByRole("img", { name: firstAlt! })).toHaveCount(0);
  await expect(gallery.getByRole("button", { name: "Ver imagen 2" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.keyboard.press("End");
  await expect(gallery.locator(".gallery-counter")).toHaveText("3 / 3");
  await page.keyboard.press("Home");
  await expect(gallery.locator(".gallery-counter")).toHaveText("1 / 3");

  for (const button of await gallery.getByRole("button").all()) {
    if (!(await button.isVisible())) continue;
    const bounds = await button.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }
});

test("lightbox nativo conserva foco, teclado y bloqueo del fondo", async ({ page }) => {
  await page.goto("/propiedades/residencia-patio");
  const expand = page.getByRole("button", { name: "Ampliar galería" });
  await expand.click();
  const dialog = page.getByRole("dialog", { name: "Galería ampliada" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cerrar galería" })).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.keyboard.press("ArrowLeft");
  await expect(dialog.locator("p").last()).toHaveText("3 / 3 · Imágenes ilustrativas");
  await expect(dialog.locator(".lightbox-image img")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(expand).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("carga real, error de imagen y recuperación independiente del optimizador", async ({ page }) => {
  let releaseImage!: () => void;
  const release = new Promise<void>((resolve) => {
    releaseImage = resolve;
  });
  await page.route("**/_next/image?*", async (route) => {
    const url = new URL(route.request().url());
    const source = url.searchParams.get("url") || "";
    if (source.includes("/hero.") && Number(url.searchParams.get("w")) > 400) {
      await release;
      await route.abort();
    } else {
      await route.continue();
    }
  });
  await page.goto("/propiedades/residencia-patio", { waitUntil: "domcontentloaded" });
  const main = page.locator(".gallery-main");
  try {
    await expect(main.getByText("Cargando fotografía…", { exact: true })).toBeVisible();
  } finally {
    releaseImage();
  }
  await expect(main.getByText("No pudimos cargar esta fotografía.")).toBeVisible();
  await expect(main.getByRole("button", { name: "Imagen siguiente" })).toBeEnabled();
  await expect(main.getByRole("link", { name: "Abrir archivo original" })).toHaveAttribute(
    "href",
    /\/_next\/static\/media\/hero\./,
  );
  await main.getByRole("button", { name: "Reintentar fotografía" }).click();
  await expect.poll(() => main.locator("img").evaluate((element: HTMLImageElement) =>
    element.complete && element.naturalWidth > 0,
  )).toBe(true);
  await expect(main.getByText("No pudimos cargar esta fotografía.")).toHaveCount(0);
  await expect(main.getByText("Cargando fotografía…", { exact: true })).toHaveCount(0);
});

test("gesto horizontal cambia la imagen y gesto vertical conserva la selección", async ({ page }) => {
  await page.goto("/propiedades/residencia-patio");
  const main = page.locator(".gallery-main");
  await main.scrollIntoViewIfNeeded();
  const swipe = (start: { x: number; y: number }, end: { x: number; y: number }) =>
    main.evaluate((element, gesture) => {
      const first = new Touch({
        identifier: 1,
        target: element,
        clientX: gesture.start.x,
        clientY: gesture.start.y,
      });
      const last = new Touch({
        identifier: 1,
        target: element,
        clientX: gesture.end.x,
        clientY: gesture.end.y,
      });
      element.dispatchEvent(new TouchEvent("touchstart", {
        bubbles: true,
        touches: [first],
        targetTouches: [first],
        changedTouches: [first],
      }));
      element.dispatchEvent(new TouchEvent("touchend", {
        bubbles: true,
        touches: [],
        targetTouches: [],
        changedTouches: [last],
      }));
    }, { start, end });
  await swipe({ x: 280, y: 250 }, { x: 100, y: 254 });
  await expect(page.locator(".gallery-counter")).toHaveText("2 / 3");
  await swipe({ x: 160, y: 300 }, { x: 164, y: 170 });
  await expect(page.locator(".gallery-counter")).toHaveText("2 / 3");
});

test("consulta móvil contextual permanece disponible y reserva espacio al pie", async ({ page }, testInfo) => {
  await page.goto("/propiedades/residencia-patio");
  const contact = page.getByRole("complementary", { name: "Consulta rápida de esta ficha" });
  if (testInfo.project.name !== "mobile") {
    await expect(contact).not.toBeVisible();
    return;
  }
  await expect(contact).toBeVisible();
  const link = contact.getByRole("link", {
    name: "Consultar por WhatsApp sobre Residencia Patio, ficha de demostración",
  });
  const url = new URL((await link.getAttribute("href"))!);
  expect(url.hostname).toBe("wa.me");
  expect(url.pathname).toBe("/18294045770");
  expect(url.searchParams.get("text")).toContain("ficha de demostración");
  expect(url.searchParams.get("text")).toContain("DEMO-001");
  const buttonBounds = await link.boundingBox();
  expect(buttonBounds!.height).toBeGreaterThanOrEqual(44);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const footer = await page.locator(".footer-disclaimer").boundingBox();
  const bar = await contact.boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(bar!.y);
});

test("ficha sin JavaScript conserva imagen, fotos originales y consulta contextual", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/propiedades/residencia-patio`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Residencia Patio");
    await expect(page.locator(".gallery-main img")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Ver fotografía [123]$/ })).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Ampliar galería" })).not.toBeVisible();
    await expect(page.getByText("Cargando fotografía…", { exact: true })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Consultar a Thony", exact: true })).toHaveAttribute(
      "href",
      /wa\.me\/18294045770/,
    );
  } finally {
    await context.close();
  }
});
