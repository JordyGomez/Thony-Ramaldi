import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
if (process.env.VERCEL_ENV)
  throw new Error(
    "Las pruebas del panel solo pueden ejecutarse fuera de Vercel.",
  );
const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  THONY_TEST_FIXTURES: "",
  THONY_ADMIN_TESTS: "1",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3335",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-fixture-key-for-thony-admin-tests",
};
const fixture = spawn(process.execPath, ["tests-admin/supabase-server.mjs"], {
  env,
  stdio: "inherit",
});
let fixtureExited = false;
fixture.once("exit", () => {
  fixtureExited = true;
});
let child;
const stop = () => {
  child?.kill("SIGINT");
  fixture.kill("SIGTERM");
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
const run = (args) =>
  new Promise((resolve, reject) => {
    child = spawn(process.execPath, args, { env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`El comando terminó con código ${code}.`)),
    );
  });
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (fixtureExited)
      throw new Error("El puerto del servidor de pruebas ya está ocupado.");
    try {
      const response = await fetch("http://127.0.0.1:3335/__test/health");
      ready = (await response.json()).fixture === "thony-local-admin";
    } catch {}
    if (ready) break;
    await delay(100);
  }
  if (!ready) throw new Error("No inició el servidor local de pruebas.");
  await run(["node_modules/next/dist/bin/next", "build"]);
  await run([
    "node_modules/@playwright/test/cli.js",
    "test",
    "--config=playwright.admin.config.ts",
  ]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  stop();
}
