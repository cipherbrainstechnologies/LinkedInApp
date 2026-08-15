import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testMatch: /^(?!.*admin-demo).*\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "admin-chromium",
      testMatch: "admin-demo.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.PLAYWRIGHT_ADMIN_URL ?? "http://localhost:3001",
      },
    },
  ],
});
