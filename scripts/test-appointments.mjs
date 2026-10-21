import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
if (process.env.VERCEL_ENV) throw new Error("Solo pruebas de citas aisladas");
const { appointmentTestEnvironment } = await import(
  "../tests-appointments/environment.mjs"
);
const env = {
  ...process.env,
  ...appointmentTestEnvironment,
  NEXT_TELEMETRY_DISABLED: "1",
};
if (!/^http:\/\/127\.0\.0\.1:3337$/.test(env.NEXT_PUBLIC_SUPABASE_URL))
  throw new Error("Base de pruebas no aislada");
const fixture = spawn(
  process.execPath,
  ["tests-appointments/supabase-server.mjs"],
  { env, stdio: "inherit" },
);
let child,
  exited = false;
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
        : reject(new Error("Comando de pruebas terminó con " + code)),
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
        (await (await fetch("http://127.0.0.1:3337/__test/health")).json())
          .fixture === "thony-appointments-isolated";
    } catch {}
    if (ready) break;
    await delay(100);
  }
  if (!ready) throw new Error("No inició PostgreSQL aislado");
  await run(["node_modules/next/dist/bin/next", "build"]);
  await run([
    "node_modules/@playwright/test/cli.js",
    "test",
    "--config=playwright.appointments.config.ts",
    ...process.argv.slice(2),
  ]);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  stop();
}
