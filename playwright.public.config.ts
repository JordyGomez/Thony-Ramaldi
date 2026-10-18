import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  testDir: "./tests-public",
  outputDir: "test-results/public",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report/public" }]],
  use: { ...base.use, baseURL: "http://127.0.0.1:3200" },
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
