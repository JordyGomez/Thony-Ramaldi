import { expect, test, type Page } from "@playwright/test";

const openFilters = async (page: Page) => {
  const toggle = page.getByRole("button", { name: "Filtros", exact: true });
  if (await toggle.isVisible()) {
    if ((await toggle.getAttribute("aria-expanded")) !== "true")
      await toggle.click();
  }
};
const cards = (page: Page) => page.locator("#propiedades .property-card");
const prices = async (page: Page) =>
  (await cards(page).locator(".property-price").allTextContents()).map(
    (text) => Number(text.replace(/[^0-9.]/g, "")),
  );

test("la búsqueda y el orden viajan en una URL compartible", async ({ page }) => {
  await page.goto("/#propiedades");
  await openFilters(page);
  const total = await cards(page).count();
  await page.getByLabel("Buscar por nombre, sector o código").fill("alberobello");
  await expect(cards(page)).toHaveCount(1);
  await expect(page).toHaveURL(/[?&]q=alberobello/);
  await page.getByLabel("Ordenar").selectOption("price-asc");
  await expect(page).toHaveURL(/orden=price-asc/);
  const shared = page.url();
  await page.goto(shared);
  await expect(cards(page)).toHaveCount(1);
  await openFilters(page);
  await expect(page.getByLabel("Ordenar")).toHaveValue("price-asc");
  await page.getByRole("button", { name: "Limpiar filtros" }).first().click();
  await expect(cards(page)).toHaveCount(total);
  await expect(page).not.toHaveURL(/q=/);
});

test("ordena por precio sin mezclar importes provisionales", async ({ page }) => {
  await page.goto("/?operacion=Venta&orden=price-asc#propiedades");
  await expect(page.getByLabel("Ordenar")).toHaveValue("price-asc");
  const ascending = await prices(page);
  expect(ascending.length).toBeGreaterThan(1);
  expect(ascending).toEqual([...ascending].sort((a, b) => a - b));
  await page.goto("/?operacion=Venta&orden=price-desc#propiedades");
  await expect(page.getByLabel("Ordenar")).toHaveValue("price-desc");
  const descending = await prices(page);
  expect(descending).toEqual([...descending].sort((a, b) => b - a));
});

test("los filtros nuevos se combinan y los datos desconocidos no cuentan", async ({
  page,
}) => {
  await page.goto("/#propiedades");
  await openFilters(page);
  await page.getByLabel("Baños", { exact: true }).selectOption("2");
  await page.getByLabel("Superficie mínima").selectOption("100");
  const count = await cards(page).count();
  for (let index = 0; index < count; index += 1)
    await expect(cards(page).nth(index).locator(".property-specs")).not.toHaveText(
      "Unidad por confirmar",
    );
  await expect(page).toHaveURL(/banos=2/);
  await expect(page).toHaveURL(/m2=100/);
});

test("favoritos sin cuenta: guardar, filtrar, conservar y quitar", async ({
  page,
}) => {
  await page.goto("/#propiedades");
  const first = cards(page).first();
  const title = (await first.locator("h3").textContent()) || "";
  const save = first.getByRole("button", { name: /^Guardar/ });
  await save.click();
  await expect(first.getByRole("button", { name: /^Guardada/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  const tab = page.getByRole("button", { name: /^Favoritas/ });
  await tab.click();
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first().locator("h3")).toHaveText(title);
  await cards(page).first().getByRole("button", { name: /^Guardada/ }).click();
  await expect(cards(page)).toHaveCount(0);
});

test("comparador de dos a cuatro propiedades", async ({ page }) => {
  await page.goto("/#propiedades");
  const compare = (index: number) =>
    cards(page).nth(index).getByRole("button", { name: /^Compar/ });
  await compare(0).click();
  const tray = page.getByRole("region", { name: "Comparador" });
  await expect(tray).toContainText("Añade otra para comparar");
  await expect(tray.getByRole("button", { name: "Comparar" })).toBeDisabled();
  await compare(1).click();
  await compare(2).click();
  await compare(3).click();
  // Quinto intento: el límite es de cuatro.
  await expect(compare(4)).toBeDisabled();
  await tray.getByRole("button", { name: "Comparar" }).click();
  const dialog = page.getByRole("dialog", { name: "Comparar propiedades" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("thead th")).toHaveCount(4);
  for (const row of ["Precio", "Superficie", "Habitaciones", "Baños", "Parqueos", "Ubicación", "Tipo", "Amenidades"])
    await expect(dialog.getByRole("rowheader", { name: row })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await tray.getByRole("button", { name: "Vaciar" }).click();
  await expect(tray).toHaveCount(0);
});

test("la ficha deja revisar y editar el mensaje de WhatsApp", async ({ page }) => {
  await page.goto("/propiedades/apartamento-brisa");
  const composer = page.locator("details", {
    hasText: "Revisar el mensaje antes de abrir WhatsApp",
  });
  await composer.locator("summary").click();
  const message = composer.getByLabel("Mensaje");
  await expect(message).toHaveValue(/Apartamento Brisa \(código [^)]+\), en venta/);
  await expect(message).toHaveValue(/ficha de demostración/);
  await composer.getByLabel("Qué quieres consultar").selectOption("visit");
  await expect(message).toHaveValue(/coordinar una visita/);
  await message.fill("Hola Thony, texto propio & con símbolos.");
  await composer.getByLabel("Qué quieres consultar").selectOption("price");
  await expect(message).toHaveValue("Hola Thony, texto propio & con símbolos.");
  const link = composer.getByRole("link", { name: /Abrir WhatsApp con este mensaje/ });
  await expect(link).toHaveAttribute(
    "href",
    `https://wa.me/18294045770?text=${encodeURIComponent("Hola Thony, texto propio & con símbolos.")}`,
  );
  await expect(composer).toContainText("solo se envía cuando lo confirmes allí");
});
