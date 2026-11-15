import { expect, test } from "@playwright/test";

test("las respuestas llevan cabeceras de seguridad", async ({ request }) => {
  for (const path of ["/", "/citas", "/admin/login", "/robots.txt"]) {
    const response = await request.get(path);
    const headers = response.headers();
    expect(headers["x-content-type-options"], path).toBe("nosniff");
    expect(headers["referrer-policy"], path).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers["x-frame-options"], path).toBe("SAMEORIGIN");
    expect(headers["content-security-policy"], path).toContain(
      "frame-ancestors 'self'",
    );
    expect(headers["permissions-policy"], path).toContain("geolocation=()");
    expect(headers["x-powered-by"], path).toBeUndefined();
  }
});

test("robots.txt permite rastrear fichas y protege las zonas privadas", async ({
  request,
}) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).not.toMatch(/Disallow: \/propiedades\//);
  for (const path of ["/admin", "/api/admin/", "/api/citas/", "/citas/seguimiento"])
    expect(body).toContain(`Disallow: ${path}`);
});

test("las páginas secundarias no heredan el canonical de la portada", async ({
  page,
}) => {
  for (const path of ["/citas/privacidad", "/no-existe-xyz"]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  }
});

test("demostraciones y fichas en preparación siguen fuera del índice", async ({
  page,
}) => {
  for (const slug of ["residencia-patio", "alberobello-residences"]) {
    await page.goto(`/propiedades/${slug}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(
      page.locator('script[type="application/ld+json"]'),
    ).toHaveCount(0);
  }
});
