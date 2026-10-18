import { expect, test } from "@playwright/test";

test("se conserva el diseño oscuro de Claude y el carrusel distingue el alquiler real", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(43, 43, 43)");
  await expect(page.locator("body")).toHaveCSS("font-family", /Inter/);
  await expect(page.getByRole("button", { name: "Abrir menú", exact: true })).toBeVisible();
  const track = page.getByRole("list", { name: "Carrusel de propiedades", exact: true });
  await expect(track.locator("li")).toHaveCount(7);
  const real = track.locator("li").filter({ hasText: "Alberobello Residences" });
  await expect(real).toContainText("Alquiler en preparación");
  await expect(real).not.toContainText("Demostración");
  await expect(track.locator(".showcase-meta").filter({ hasText: "Demostración" })).toHaveCount(6);
  if (testInfo.project.name === "mobile") {
    await expect(page.getByRole("button", { name: "Más propiedades", exact: true, includeHidden: true })).not.toBeVisible();
    await track.focus();
    await page.keyboard.press("ArrowRight");
  } else {
    await page.getByRole("button", { name: "Más propiedades", exact: true }).click();
  }
  await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  if (testInfo.project.name === "mobile") {
    await page.keyboard.press("ArrowLeft");
  } else {
    await page.getByRole("button", { name: "Propiedades anteriores", exact: true }).click();
  }
  await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBe(0);
});

test("sin JavaScript el carrusel conserva desplazamiento nativo y enlaces claros", async ({ browser, page, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()!, reducedMotion: "reduce" });
  try {
    const plain = await context.newPage();
    await plain.goto(`${baseURL}/`);
    const track = plain.getByRole("list", { name: "Carrusel de propiedades", exact: true });
    await expect(track.locator("li")).toHaveCount(7);
    await expect(plain.getByRole("button", { name: "Más propiedades", exact: true })).not.toBeVisible();
    const real = track.locator("li").filter({ hasText: "Alberobello Residences" });
    await expect(real).toContainText("Alquiler en preparación");
    await expect(real.getByRole("link")).toHaveAttribute("href", "/propiedades/alberobello-residences");
    await track.focus();
    await plain.keyboard.press("ArrowRight");
    await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});
