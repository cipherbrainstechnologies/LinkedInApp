import { test, expect, type APIRequestContext } from "@playwright/test";

const API = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:4000/v1";
const ADMIN_BASE = process.env.PLAYWRIGHT_ADMIN_URL ?? "http://localhost:3001";

async function adminDemoLogin(request: APIRequestContext) {
  const res = await request.post(`${API}/admin/auth/demo/login`, {
    data: { email: "support@demo.applyflow.local" },
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

test.describe("Admin demo auth (AF-ADM-001)", () => {
  test("unauthenticated admin redirects to login", async ({ page }) => {
    await page.goto(`${ADMIN_BASE}/users`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /ApplyFlow Admin/i })).toBeVisible();
  });

  test("demo admin login reaches dashboard", async ({ page, request }) => {
    await page.goto(`${ADMIN_BASE}/login`);
    await page.getByRole("button", { name: /Continue as Demo Admin/i }).click();
    await expect(page.getByRole("heading", { name: /Operations dashboard/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Support/i)).toBeVisible();
  });

  test("demo admin can search users and open profile", async ({ page }) => {
    await adminDemoLogin(page.request);
    await page.goto(`${ADMIN_BASE}/users`);
    await expect(page.getByRole("heading", { name: /Registered users/i })).toBeVisible();
    await page.getByPlaceholder(/Search/i).fill("experienced");
    await expect(page.getByRole("link", { name: /View/i }).first()).toBeVisible({ timeout: 10_000 });
    await page.getByRole("link", { name: /View/i }).first().click();
    await expect(page.getByText(/Quota ledger/i)).toBeVisible();
  });

  test("demo admin logout returns to login", async ({ page }) => {
    await adminDemoLogin(page.request);
    await page.goto(`${ADMIN_BASE}/`);
    await page.getByRole("button", { name: /Log out/i }).click();
    await expect(page).toHaveURL(/\/login/);
    const me = await page.request.get(`${API}/admin/auth/me`);
    expect(me.status()).toBe(401);
  });

  test("authenticated admin me returns profile", async ({ request }) => {
    await adminDemoLogin(request);
    const me = await request.get(`${API}/admin/auth/me`);
    expect(me.ok()).toBeTruthy();
    const body = await me.json();
    expect(body.email).toBe("support@demo.applyflow.local");
    expect(body.permissions).toContain("customers.read");
  });
});
