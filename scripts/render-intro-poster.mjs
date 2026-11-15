// Genera los pósteres de la introducción a partir de la misma escena WebGL
// que ve el visitante (cuadro inicial, puerta cerrada). Uso:
//   node scripts/render-intro-poster.mjs            → public/intro/puerta-*.webp
//   node scripts/render-intro-poster.mjs --frames   → cuadros de revisión en /tmp
// Requiere Chromium de Playwright y descarga esbuild con npx (solo desarrollo).
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const work = mkdtempSync(join(tmpdir(), "intro-"));
const framesMode = process.argv.includes("--frames");
const outArg = process.argv.find((arg) => arg.startsWith("--out="));
const framesDir = outArg ? resolve(outArg.slice(6)) : join(work, "frames");

execFileSync(
  "npx",
  [
    "--yes",
    "esbuild@0.25.11",
    join(root, "src/components/intro/door-scene.ts"),
    "--bundle",
    "--format=iife",
    "--global-name=DoorLab",
    `--outfile=${join(work, "lab.js")}`,
    "--log-level=warning",
  ],
  { stdio: "inherit", cwd: root },
);

const types = { ".js": "text/javascript", ".webp": "image/webp", ".html": "text/html" };
const server = createServer((request, response) => {
  const path = new URL(request.url, "http://x").pathname;
  const file =
    path === "/" ? null : path === "/lab.js" ? join(work, "lab.js") : join(root, "public", path);
  if (!file) {
    response.writeHead(200, { "content-type": "text/html" });
    return response.end(
      '<!doctype html><body style="margin:0;background:#131211"><script src="/lab.js"></script></body>',
    );
  }
  if (!file.startsWith(root) && !file.startsWith(work)) return response.writeHead(403).end();
  if (!existsSync(file)) return response.writeHead(404).end();
  response.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  response.end(readFileSync(file));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;

// CHROMIUM_PATH permite reutilizar un navegador ya instalado en el entorno.
const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--no-sandbox"],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
async function render({ width, height, poster, times }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on("pageerror", (error) => console.error("pageerror", error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      console.error(message.type(), message.text());
  });
  await page.goto(origin);
  await page.evaluate(
    async ({ width, height, poster }) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.style.cssText = `display:block;width:${width}px;height:${height}px`;
      document.body.appendChild(canvas);
      window.lab = window.DoorLab.createDoorScene(canvas, {
        pixelRatio: 1,
        quality: "high",
        poster,
      });
      window.lab.canvas = canvas;
      await window.lab.ready;
    },
    { width, height, poster },
  );
  const shots = [];
  for (const time of times) {
    const data = await page.evaluate((time) => {
      window.lab.renderAt(time);
      return window.lab.canvas.toDataURL("image/png");
    }, time);
    shots.push(Buffer.from(data.split(",")[1], "base64"));
  }
  await page.evaluate(() => window.lab.dispose());
  await page.close();
  return shots;
}

if (framesMode) {
  mkdirSync(framesDir, { recursive: true });
  const times = [0, 900, 1500, 2100, 2700];
  for (const [name, width, height] of [
    ["escritorio", 1440, 900],
    ["movil", 390, 844],
  ]) {
    const shots = await render({ width, height, times });
    for (const [index, shot] of shots.entries())
      await sharp(shot).toFile(join(framesDir, `${name}-${times[index]}.png`));
  }
  console.log(framesDir);
} else {
  const out = join(root, "public/intro");
  const [landscape] = await render({ width: 1920, height: 1080, poster: "landscape", times: [0] });
  await sharp(landscape).webp({ quality: 82, effort: 6 }).toFile(join(out, "puerta-horizontal.webp"));
  const [portrait] = await render({ width: 1280, height: 2176, poster: "portrait", times: [0] });
  await sharp(portrait).webp({ quality: 82, effort: 6 }).toFile(join(out, "puerta-vertical.webp"));
  console.log("Pósteres generados en public/intro");
}
await browser.close();
server.close();
