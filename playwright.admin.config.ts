import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
export default defineConfig({
  testDir: "./tests-admin",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report-admin" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3300",
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
    command: "npm run start -- --port 3300",
    url: "http://127.0.0.1:3300/admin/login",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      THONY_ADMIN_TESTS: "1",
      THONY_TEST_FIXTURES: "",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3335",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        "local-anon-fixture-key-for-thony-admin-tests",
    },
  },
});
