import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("la búsqueda personal prepara una consulta concreta sin crear anuncios ni enviar datos automáticamente", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const scene = page.locator("#mi-proximo-espacio");
  await scene.getByRole("button", { name: "Diseñar mi búsqueda" }).click();
  await scene.getByLabel("Alquilar", { exact: true }).check();
  await scene.getByRole("button", { name: "Continuar", exact: true }).click();
  await scene.getByLabel("Ciudad o zona", { exact: true }).fill("Santiago");
  await scene
    .getByLabel("Presupuesto máximo en USD / mes", { exact: true })
    .fill("1200");
  await scene.getByRole("button", { name: "Continuar", exact: true }).click();
  await scene
    .getByLabel("¿Cuándo te gustaría dar el paso?")
    .selectOption("En los próximos tres meses");
  const link = scene.getByRole("link", {
    name: "Compartir mi búsqueda con Thony",
  });
  const href = new URL((await link.getAttribute("href"))!);
  expect(href.hostname).toBe("wa.me");
  expect(href.searchParams.get("text")).toContain("Quiero: alquilar.");
  expect(href.searchParams.get("text")).toContain("Santiago");
  expect(href.searchParams.get("text")).toContain("hasta USD 1,200 al mes");
  expect(href.searchParams.get("text")).toContain("próximos tres meses");
  expect(
    (await new AxeBuilder({ page }).include("#mi-proximo-espacio").analyze())
      .violations,
  ).toEqual([]);
  await scene.getByRole("button", { name: "Atrás", exact: true }).click();
  await expect(scene.getByLabel("Ciudad o zona", { exact: true })).toHaveValue(
    "Santiago",
  );
});
