// Lim Yih Fei A0256993J
import { test, expect } from "@playwright/test";

test.describe("Orders Management UI Tests (True E2E)", () => {
  let userEmail;

  test.describe("Authenticated Order Scenarios", () => {
    test.beforeEach(async ({ page }) => {
      // 1. Register a fresh user completely isolating the database state for this test
      userEmail = `buyer${Date.now()}@example.com`;
      
      await page.goto("http://localhost:3000/register");
      await page.getByPlaceholder("Enter Your Name").fill("Test Buyer");
      await page.getByPlaceholder("Enter Your Email").fill(userEmail);
      await page.getByPlaceholder("Enter Your Password").fill("password123");
      await page.getByPlaceholder("Enter Your Phone").fill("111111");
      await page.getByPlaceholder("Enter Your Address").fill("123 St");
      await page.locator("#exampleInputDOB1").fill("2000-01-01");
      await page.getByPlaceholder("What is Your Favorite sports").fill("Golf");
      
      await page.getByRole("button", { name: "REGISTER" }).click();
      
      await page.waitForURL(/\/login/);

      // 2. Login
      await page.getByPlaceholder("Enter Your Email").fill(userEmail);
      await page.getByPlaceholder("Enter Your Password").fill("password123");
      await page.getByRole("button", { name: "LOGIN" }).click();

      await page.waitForURL(/\/$/);
    });

    test("should gracefully render when the new user has no orders in the live backend", async ({ page }) => {
      // 3. Navigate to the Orders Dashboard explicitly requiring the validated token
      await page.goto("http://localhost:3000/dashboard/user/orders");

      // Verify standard layout structures map natively
      const mainHeading = page.getByRole("heading", { name: "All Orders" });
      await expect(mainHeading).toBeVisible();
      await expect(mainHeading).toHaveCSS("text-align", "center");

      // Validates structural UI grid layout mapping the page specifically
      const dashboardContainer = page.locator(".dashboard");
      await expect(dashboardContainer).toHaveCSS("display", "block");

      // Verify the absence of the table rows reflecting the empty real orders database state
      await expect(page.locator("table")).toHaveCount(0);
    });

    // done so that we can test orders page without database seeding reliably without worrying about the database state
    test("should leverage API mocking to render and verify actual populated order layouts flawlessly", async ({ page }) => {
      // 1. Intercept the live backend request and inject our own populated Orders payload
      await page.route("*/**/api/v1/auth/orders", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              _id: "mockOrder123",
              status: "Processing",
              buyer: { name: "Mock Tester" },
              createAt: new Date().toISOString(), 
              payment: { success: true },
              products: [
                {
                  _id: "mockProduct123",
                  name: "Mocked React Course",
                  description: "A highly detailed mocked description taking over 30 chars.",
                  price: 49.99,
                },
              ],
            },
          ]),
        });
      });

      // 2. Prevent terminal 404 spam by gracefully mocking the dynamic product photo mapping
      await page.route("*/**/api/v1/product/product-photo/*", async (route) => {
        await route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("") });
      });

      // 3. Navigate to the Orders page forcing the front-end to render our mocked JSON
      await page.goto("http://localhost:3000/dashboard/user/orders");

      // 4. Assert the populated Table headers and nested Rows exist
      await expect(page.locator("table")).toHaveCount(1);
      await expect(page.locator("th").filter({ hasText: "Status" })).toBeVisible();
      await expect(page.getByRole("cell", { name: "Processing" })).toBeVisible();
      await expect(page.getByRole("cell", { name: "Mock Tester" })).toBeVisible();
      await expect(page.getByRole("cell", { name: "Success" })).toBeVisible();
      
      // 5. Assert the mapped deeply nested Product layout properties
      await expect(page.getByText("Mocked React Course")).toBeVisible();
      await expect(page.getByText("Price : 49.99")).toBeVisible();
    });
  });

  test.describe("Unauthenticated Order Scenarios", () => {
    test("should block unauthenticated access to the Orders view via immediate Router redirect", async ({ page }) => {
      // Intentionally navigating without logging in
      await page.goto("http://localhost:3000/dashboard/user/orders");

      // Verify layout is firmly blocked and routing intercepts the attempt
      await expect(page.getByRole("heading", { name: "All Orders" })).not.toBeVisible();
    });
  });
});
