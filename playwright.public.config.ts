import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  testDir: "./tests-public",
  outputDir: "test-results/public",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report/public" }]],
  use: { ...base.use, baseURL: "http://127.0.0.1:3200",
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
    } },
  projects: base.projects,
  webServer: {
    command: "npm run start -- --port 3200",
    url: "http://127.0.0.1:3200",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: {
      THONY_TEST_FIXTURES: "",
      NODE_USE_ENV_PROXY: "1",
    },
  },
});
