import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("sin inventario, la web real no publica las fixtures ni fotografías de viviendas ajenas", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".property-card, .showcase-card")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Estamos preparando nuestra selección de propiedades/ })).toBeVisible();
  await expect(page.locator(".catalog-empty").getByRole("link", { name: "Escribir a Thony" })).toHaveAttribute("href", /^https:\/\/wa\.me\/18294045770/);
  await expect(page.locator('.catalog-empty a[href="tel:+18294045770"]')).toBeVisible();
  await expect(page.locator(".hero-image")).toHaveAttribute("src", /thony-paulino/);
  await expect(page.locator('img[src*="portada"], img[src*="villa."], img[src*="hero."]')).toHaveCount(0);
  await expect(page.getByText(/Residencia Olivo|Apartamento Luz|Penthouse Horizonte|US\$1,000/)).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("las fichas de pruebas no están disponibles en el sitio sin fixtures", async ({ page }) => {
  const response = await page.goto("/propiedades/residencia-patio");
  expect(response?.status()).toBe(404);
});

test("el panel queda separado de la escena pública y conserva su entrada protegida", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.locator(".preloader, .site-header, .hero, .site-footer")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  if (new URL(page.url()).pathname === "/admin/login") {
    await expect(page.getByRole("heading", { name: "Entrar", exact: true })).toBeVisible();
    await expect(page.getByLabel("Correo", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("pendiente de activar");
  }
});
