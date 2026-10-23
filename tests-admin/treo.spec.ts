import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import source from "../src/data/treo-ii-source.json";
import { emptyPropertyInput } from "../src/app/admin/property-input";
const treoUnits = source.units.map((u) => ({
  unit: u.unit,
  building: u.buildingGroup,
  area: u.areaValue,
  priceMinorUnits: u.priceMinorUnits,
  bedrooms: u.bedrooms,
  bathrooms: u.bathrooms,
  parking: u.parkingSpaces,
}));
const assetCount = 13;
import {
  projectUnits,
  unitDescription,
  projectPrice,
} from "../src/lib/project-units";
import { validatePropertyInput } from "../src/app/admin/property-input";
const fixture = "http://127.0.0.1:3335";
async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Correo", { exact: true }).fill("admin@example.test");
  await page.getByLabel("Contraseña").fill("local-test-password");
  await page
    .getByRole("button", { name: "Entrar al panel", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
}
test.beforeEach(async ({ request, page }) => {
  await request.post(fixture + "/__test/reset");
  await page.route(
    (url) =>
      url.pathname === "/_next/image" &&
      Boolean(url.searchParams.get("url")?.startsWith(fixture)),
    async (route) => {
      const target = new URL(route.request().url()).searchParams.get("url")!;
      const response = await request.get(target);
      await route.fulfill({ response });
    },
  );
});
test("listado exacto: 16 referencias únicas, centavos, baños fraccionarios y precio desde coherente", () => {
  expect(treoUnits).toHaveLength(16);
  expect(projectUnits(treoUnits.map(unitDescription))).toEqual(treoUnits);
  expect(treoUnits.filter((u) => u.area === 119)).toHaveLength(10);
  expect(treoUnits.filter((u) => u.area === 122)).toHaveLength(6);
  expect(treoUnits.find((u) => u.unit === "H3")?.priceMinorUnits).toBe(
    22321722,
  );
  expect(treoUnits.find((u) => u.unit === "H2")?.bathrooms).toBe(2.5);
  expect(projectPrice(21449750)).toContain("214,497.50");
  expect(
    projectUnits([
      unitDescription(treoUnits[0]),
      unitDescription(treoUnits[0]),
    ]),
  ).toEqual([]);
  expect(projectUnits(["Texto de una tipología antigua"])).toEqual([]);
  const valid = {
    ...emptyPropertyInput,
    title: "TREO II Residences",
    slug: "treo-ii-residences",
    reference: "TREO-II",
    location: "Santiago",
    description: "Ficha del material aportado",
    price: 214497.5,
    projectTypologies: treoUnits.map(unitDescription),
    images: [{ path: "media/prueba.webp", alt: "Render del proyecto" }],
  };
  expect(validatePropertyInput(valid)).toBeNull();
  expect(
    validatePropertyInput({
      ...valid,
      projectTypologies: [
        valid.projectTypologies[0],
        valid.projectTypologies[0],
      ],
    }),
  ).toContain("Revisa las unidades");
  expect(validatePropertyInput({ ...valid, price: 100 })).toContain(
    "unidad de menor precio",
  );
});
test("preparación y preview requieren sesión y rol; un parámetro público no publica el proyecto", async ({
  page,
  request,
}) => {
  await page.goto("/admin/proyectos/treo-ii/vista-previa");
  await expect(page).toHaveURL(/admin\/login/);
  expect(
    (await request.get("/propiedades/treo-ii-residences?preview=1")).status(),
  ).toBe(404);
  await request.post(fixture + "/__test/state", { data: { admin: false } });
  await login(page);
  expect((await page.request.get("/admin/proyectos/treo-ii")).status()).toBe(
    404,
  );
  expect(
    (await page.request.get("/admin/proyectos/treo-ii/vista-previa")).status(),
  ).toBe(404);
});
test("preview privada usa renders reales sin escribir datos, cambia planos y respeta movimiento reducido", async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto("/admin/proyectos/treo-ii/vista-previa");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("TREO");
  await page.getByRole("button", { name: "Isométrico B", exact: true }).click();
  await expect(
    page.getByRole("img", {
      name: "Plano isométrico del proyecto TREO II · Tipo B",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Perspectiva del plano", { exact: true }).fill("8");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const img = page.getByRole("img", {
    name: "Plano isométrico del proyecto TREO II · Tipo B",
    exact: true,
  });
  await expect(img.locator("..")).toHaveCSS("transform", "none");
  const state = await (await request.get(fixture + "/__test/state")).json();
  expect(state.propertyCount).toBe(0);
  expect(state.uploads).toBe(0);
  expect((await request.get("/propiedades/treo-ii-residences")).status()).toBe(
    404,
  );
});
test("preparación completa publica desde el panel, no duplica y ofrece unidad/planos en PC y móvil", async ({
  page,
  request,
}) => {
  test.setTimeout(90000);
  await login(page);
  await page.goto("/admin/proyectos/treo-ii");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "TREO II Residences",
  );
  expect(
    (await (await request.get(fixture + "/__test/state")).json()).uploads,
  ).toBe(0);
  await page
    .getByRole("button", { name: "Preparar imágenes y ficha", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Revisa y guarda la propiedad",
      exact: true,
    }),
  ).toBeVisible({ timeout: 45000 });
  await expect(page.getByLabel("Precio (USD)", { exact: true })).toHaveValue(
    "214497.5",
  );
  await page
    .getByRole("button", { name: "Publicar propiedad", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
  const state = await (await request.get(fixture + "/__test/state")).json();
  expect(state.uploads).toBe(assetCount);
  expect(state.propertyCount).toBe(1);
  await page.goto("/propiedades/treo-ii-residences");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("TREO");
  await expect(
    page.getByText("214,497.50", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: /^H3\s/ }).click();
  const selected = page.getByRole("complementary", {
    name: "Unidad seleccionada",
  });
  await expect(selected).toContainText("223,217.22");
  expect(
    decodeURIComponent(
      (await selected
        .getByRole("link", { name: /Consultar unidad H3/ })
        .getAttribute("href")) || "",
    ),
  ).toContain("H3");
  await page.getByLabel("Edificio", { exact: true }).selectOption("A-B");
  expect(
    await page
      .getByLabel("Unidades del listado", { exact: true })
      .getByRole("button")
      .count(),
  ).toBe(2);
  await page.getByRole("button", { name: /^B1\s/ }).click();
  await expect(selected).toContainText("219,905.00");
  await page.getByRole("button", { name: "Isométrico B", exact: true }).click();
  await page.getByLabel("Perspectiva del plano", { exact: true }).fill("6");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/treo-${name}.png`,
      fullPage: true,
    });
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/admin/proyectos/treo-ii");
  await expect(
    page.getByRole("heading", { name: "TREO II ya está en el panel" }),
  ).toBeVisible();
  expect(
    (await (await request.get(fixture + "/__test/state")).json()).uploads,
  ).toBe(assetCount);
});
