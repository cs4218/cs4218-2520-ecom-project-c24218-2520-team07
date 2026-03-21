import { test, expect } from "@playwright/test";

test.describe("Admin Users Dashboard UI Tests (True E2E)", () => {
  let standardUserEmail;

  test.beforeEach(async ({ page }) => {
    // We register a standard user (role 0) to uniquely test Role Based Access Control (RBAC) securely
    standardUserEmail = `standard${Date.now()}@example.com`;
    
    await page.goto("http://localhost:3000/register");
    await page.getByPlaceholder("Enter Your Name").fill("Standard User");
    await page.getByPlaceholder("Enter Your Email").fill(standardUserEmail);
    await page.getByPlaceholder("Enter Your Password").fill("password123");
    await page.getByPlaceholder("Enter Your Phone").fill("111111");
    await page.getByPlaceholder("Enter Your Address").fill("123 St");
    await page.locator("#exampleInputDOB1").fill("2000-01-01");
    await page.getByPlaceholder("What is Your Favorite sports").fill("Golf");
    
    await page.getByRole("button", { name: "REGISTER" }).click();
    await page.waitForURL(/\/login/);

    // Login as the standard user
    await page.getByPlaceholder("Enter Your Email").fill(standardUserEmail);
    await page.getByPlaceholder("Enter Your Password").fill("password123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL(/\/$/);
  });

  test("should block standard users from rendering the Admin Users dashboard (RBAC E2E)", async ({ page }) => {
    // Attempt to directly navigate to the protected admin page 
    await page.goto("http://localhost:3000/dashboard/admin/users");

    // The backend admin-auth controller handles this, typically bouncing standard users effectively.
    // Ensure the "All Users" secure UI is NOT rendered for this role.
    await expect(page.getByRole("heading", { name: "All Users" })).not.toBeVisible();
    
    // We expect the Spinner to catch it, or a seamless redirect if programmed.
  });
  
  test("should block totally unauthenticated visitors from rendering the Admin Users dashboard", async ({ page }) => {
    // Clear browser cookies/storage forcing extreme unauthenticated state
    await page.context().clearCookies();
    await page.evaluate(() => window.localStorage.clear());
    
    // Navigate to admin
    await page.goto("http://localhost:3000/dashboard/admin/users");
    
    // Verify pure denial
    await expect(page.getByRole("heading", { name: "All Users" })).not.toBeVisible();
  });
});
