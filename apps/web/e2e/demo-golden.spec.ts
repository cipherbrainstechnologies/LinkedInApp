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

  test("prepare application from job detail", async ({ page }) => {
    await demoLogin(page, "experienced-launch");
    await page.goto("/discover");
    await page.getByRole("link", { name: /Software Engineer/i }).click();
    await page.getByRole("button", { name: /Prepare application/i }).click();
    await expect(page).toHaveURL(/\/applications\//);
    const prepareScreening = page.getByRole("button", { name: /Prepare screening questions/i });
    await expect(prepareScreening).toBeVisible({ timeout: 20_000 });
    await prepareScreening.click();
    await expect(page.getByText(/Screening answers/i)).toBeVisible();
  });

  test("upgrade Launch to Power preserves usage (BILL-02)", async ({ page }) => {
    await demoLogin(page, "experienced-launch");

    const subRes = await page.request.get(`${API}/billing/subscription`);
    const subData = await subRes.json();
    if (subData.pendingPayment?.state === "PENDING") {
      await page.request.post(`${API}/billing/webhooks/mock`, {
        data: { paymentId: subData.pendingPayment.id, event: "payment.failed" },
      });
    }

    await page.goto("/plan");
    await expect(page.getByText(/20 used of 50/i)).toBeVisible();

    await page.getByRole("button", { name: /Preview upgrade/i }).nth(2).click();
    await expect(page.getByText(/Available after upgrade: 80/i)).toBeVisible();

    await page.getByRole("button", { name: /Confirm this upgrade/i }).click();
    await expect(page.getByText(/Payment pending webhook confirmation/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Simulate webhook success/i })).toBeVisible();
    await expect(page.getByText(/30 available/i)).toBeVisible();

    await page.getByRole("button", { name: /Simulate webhook success/i }).click();
    await expect(page.getByText(/20 used of 100/i)).toBeVisible();
    await expect(page.getByText(/80 available/i)).toBeVisible();
  });
});
