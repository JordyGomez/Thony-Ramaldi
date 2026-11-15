import { expect, test } from "@playwright/test";

// Sesión nueva: sin la cookie que marca la introducción como vista.
test.use({ storageState: { cookies: [], origins: [] } });

const intro = "[data-door-intro]";

test("la puerta aparece en la primera visita y deja paso a la portada", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator(intro)).toBeVisible();
  // El póster llega en el HTML del servidor: hay puerta antes de cargar WebGL.
  await expect(page.locator(`${intro} img`)).toHaveJSProperty("complete", true);
  // Nunca supera el límite de seguridad de cinco segundos.
  await expect(page.locator(intro)).toHaveCount(0, { timeout: 6500 });
  await expect(page.locator("h1")).toBeVisible();
  expect(errors).toEqual([]);
  // Liberación de la GPU: no queda ningún lienzo en el documento.
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("solo se muestra una vez por sesión", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(intro)).toHaveCount(0, { timeout: 6500 });
  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => cookie.name === "thony_intro")).toBe(true);
  await page.reload({ waitUntil: "commit" });
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(intro)).toHaveCount(0);
});

test("se puede saltar con el teclado y con el botón", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(intro)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(intro)).toHaveCount(0, { timeout: 1500 });
  await page.context().clearCookies();
  // Con las texturas retenidas la puerta espera en su imagen inicial: el
  // botón sigue disponible el tiempo suficiente para pulsarlo.
  await page.route("**/intro/caoba-*.webp", () => {});
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await expect(page.locator(intro)).toHaveCount(0, { timeout: 1500 });
});

test("con movimiento reducido no hay introducción", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(intro)).toBeHidden();
  await context.close();
});

test("sin JavaScript la portada no queda cubierta", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(intro)).toBeHidden();
  await context.close();
});

test("sin WebGL se usa la imagen inicial y se entra igualmente", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(intro)).toBeVisible();
  await expect(page.locator(intro)).toHaveCount(0, { timeout: 4000 });
  await expect(page.locator("h1")).toBeVisible();
});

test("no aparece al llegar a la portada desde una ficha", async ({ page }) => {
  await page.goto("/propiedades/alberobello-residences");
  await page.locator('a[href="/"]').first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(intro)).toHaveCount(0);
});
