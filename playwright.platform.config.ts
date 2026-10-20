import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
export default defineConfig({
  testDir: "./tests-platform",
  testMatch: "*.spec.ts",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 45000,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3400",
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
    command: "npm run start -- --port 3400",
    url: "http://127.0.0.1:3400/admin/login",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      THONY_PLATFORM_TESTS: "1",
      THONY_ADMIN_TESTS: "1",
      THONY_TEST_FIXTURES: "",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3336",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        "local-anon-key-for-isolated-platform-tests",
      NEXT_PUBLIC_SITE_URL: "https://site.example.test",
      NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY: "isolated-site-key",
    },
  },
});
