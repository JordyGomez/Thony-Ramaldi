import { expect, test } from "@playwright/test";
import { parseReelUrl, reelEmbedUrl } from "../src/lib/instagram";

test("valida y normaliza enlaces de reels", () => {
  const canonical = "https://www.instagram.com/reel/DAbc123_-xY/";
  for (const url of [
    "https://www.instagram.com/reel/DAbc123_-xY/",
    "https://instagram.com/reel/DAbc123_-xY",
    "https://www.instagram.com/reels/DAbc123_-xY/?igsh=abc",
    "https://www.instagram.com/thonypaulino_ramaldi/reel/DAbc123_-xY/",
    "  https://www.instagram.com/reel/DAbc123_-xY/#x ",
  ])
    expect(parseReelUrl(url)?.permalink, url).toBe(canonical);
  expect(parseReelUrl("https://www.instagram.com/p/DAbc123/")?.permalink).toBe(
    "https://www.instagram.com/p/DAbc123/",
  );
  expect(reelEmbedUrl(canonical)).toBe(`${canonical}embed`);
});

test("rechaza enlaces que no son de Instagram o no son reels", () => {
  for (const url of [
    "",
    "no es un enlace",
    "http://www.instagram.com/reel/DAbc123/",
    "https://instagram.com.evil.example/reel/DAbc123/",
    "https://evil.example/https://www.instagram.com/reel/DAbc123/",
    "https://user:pass@www.instagram.com/reel/DAbc123/",
    "https://www.instagram.com:8443/reel/DAbc123/",
    "https://www.instagram.com/thonypaulino_ramaldi/",
    "https://www.instagram.com/reel/<script>/",
    "javascript:alert(1)",
  ])
    expect(parseReelUrl(url), url).toBeNull();
});

test("sin conexión ni enlace configurado el bloque del reel no aparece", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#sobre-thony")).toBeVisible();
  await expect(page.locator("[data-reel-source]")).toHaveCount(0);
});
