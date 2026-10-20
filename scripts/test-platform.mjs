import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
if (process.env.VERCEL_ENV)
  throw new Error("Solo pruebas de plataforma aisladas");
const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  THONY_PLATFORM_TESTS: "1",
  THONY_ADMIN_TESTS: "1",
  THONY_TEST_FIXTURES: "",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3336",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key-for-isolated-platform-tests",
  NEXT_PUBLIC_SITE_URL: "https://site.example.test",
  NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY: "isolated-site-key",
};
const fixture = spawn(
  process.execPath,
  ["tests-platform/supabase-server.mjs"],
  { env, stdio: "inherit" },
);
let child;
let exited = false;
fixture.once("exit", () => {
  exited = true;
});
const run = (args) =>
  new Promise((resolve, reject) => {
    child = spawn(process.execPath, args, { env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Comando terminado con ${code}`)),
    );
  });
const stop = () => {
  child?.kill("SIGINT");
  fixture.kill("SIGTERM");
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
try {
  let ready = false;
  for (let n = 0; n < 150; n++) {
    if (exited) throw new Error("No inició el servidor aislado");
    try {
      ready =
        (await (await fetch("http://127.0.0.1:3336/__test/health")).json())
          .fixture === "thony-platform-isolated";
    } catch {}
    if (ready) break;
    await delay(100);
  }
  if (!ready) throw new Error("No inició PostgreSQL aislado");
  await run(["node_modules/next/dist/bin/next", "build"]);
  await run([
    "node_modules/@playwright/test/cli.js",
    "test",
    "--config=playwright.platform.config.ts",
    ...process.argv.slice(2),
  ]);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  stop();
}
