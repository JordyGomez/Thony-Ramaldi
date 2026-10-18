import { expect, test } from "@playwright/test";

test("sin Supabase configurado, /admin explica que el panel está pendiente y no se indexa", async ({
  page,
}) => {
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "pendiente de activar",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  // El panel queda fuera del envoltorio público del sitio.
  await expect(page.locator(".site-header")).toHaveCount(0);
});

test("las ubicaciones del filtro salen de las propiedades publicadas", async ({
  page,
}) => {
  await page.goto("/#propiedades");
  const options = await page
    .locator('select[name="catalog-location"] option')
    .allTextContents();
  expect(options).toEqual(["Todas", "Punta Cana", "Santiago", "Santo Domingo"]);
});
