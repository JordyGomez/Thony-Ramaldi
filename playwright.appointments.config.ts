import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import { appointmentTestEnvironment as env } from "./tests-appointments/environment.mjs";
export default defineConfig({
  testDir: "./tests-appointments",
  testMatch: "*.spec.ts",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60000,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3401",
    // Las regresiones entran con la introducción 3D ya vista en la sesión;
    // tests/intro.spec.ts la comprueba aparte con una sesión nueva.
    storageState: {
      cookies: [
        {
          name: "thony_intro",
          value: "1",
          domain: "127.0.0.1",
          path: "/",
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    },
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    launchOptions: {
      ...(existsSync("/usr/bin/chromium")
        ? { executablePath: "/usr/bin/chromium" }
        : {}),
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "npm run start -- --port 3401",
    url: "http://127.0.0.1:3401/admin/login",
    reuseExistingServer: false,
    timeout: 60000,
    env,
  },
});
export { env as appointmentTestEnvironment };
