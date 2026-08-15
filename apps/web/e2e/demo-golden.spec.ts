import { test, expect, type Page } from "@playwright/test";

const API = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:4000/v1";

async function demoLogin(page: Page, personaId: string) {
  const res = await page.request.post(`${API}/auth/demo/login`, {
    data: { personaId },
    headers: { "Content-Type": "application/json" },
  });
  expect(res.ok()).toBeTruthy();
}

test.beforeAll(async ({ request }) => {
  const health = await request.get(`${API.replace("/v1", "")}/health`);
  if (!health.ok()) {
    test.skip(true, "API not running");
  }
});

test.describe("DEMO-02 golden paths", () => {
  test("experienced demo persona reaches home", async ({ page }) => {
    await demoLogin(page, "experienced-launch");
    await page.goto("/home");
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
  });

  test("fresher persona can open onboarding", async ({ page }) => {
    await demoLogin(page, "fresher-free");
    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible();
  });

  test("discover lists seeded jobs", async ({ page }) => {
    await demoLogin(page, "experienced-launch");
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: /Discover jobs/i })).toBeVisible();
    await expect(page.locator("ul li").first()).toBeVisible({ timeout: 15_000 });
  });

  test("applications page loads for authenticated user", async ({ page }) => {
    await demoLogin(page, "experienced-launch");
    await page.goto("/applications");
    await expect(page.getByRole("heading", { name: /Applications/i })).toBeVisible();
  });

  test("plan page loads for launch user", async ({ page }) => {
    await demoLogin(page, "experienced-launch");
    await page.goto("/plan");
    await expect(page.getByRole("heading", { name: /Plan & billing/i })).toBeVisible();
  });
});
