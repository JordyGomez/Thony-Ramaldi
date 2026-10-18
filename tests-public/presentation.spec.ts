import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("sin inventario, la web conserva las fotos ilustrativas de Claude sin publicar anuncios ficticios", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".property-card, .showcase-card")).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: /Pronto publicaremos nuevas propiedades/,
    }),
  ).toBeVisible();
  await expect(
    page
      .locator(".catalog-empty")
      .getByRole("link", { name: "Escribir a Thony" }),
  ).toHaveAttribute("href", /^https:\/\/wa\.me\/18294045770/);
  await expect(
    page.locator('.catalog-empty a[href="tel:+18294045770"]'),
  ).toBeVisible();
  await expect(page.locator(".hero-image")).toHaveAttribute("src", /portada/);
  await expect(
    page.locator(".hero .photo-note, .footer-image .photo-note"),
  ).toHaveText(["Fotografía ilustrativa", "Fotografía ilustrativa"]);
  await expect(
    page.getByText(
      /Residencia Olivo|Apartamento Luz|Penthouse Horizonte|US\$1,000/,
    ),
  ).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("las fichas de pruebas no están disponibles en el sitio sin fixtures", async ({
  page,
}) => {
  const response = await page.goto("/propiedades/residencia-patio");
  expect(response?.status()).toBe(404);
});

test("el panel queda separado de la escena pública y conserva su entrada protegida", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(
    page.locator(".preloader, .site-header, .hero, .site-footer"),
  ).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  if (new URL(page.url()).pathname === "/admin/login") {
    await expect(
      page.getByRole("heading", { name: "Entrar", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Correo", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "pendiente de activar",
    );
  }
});
