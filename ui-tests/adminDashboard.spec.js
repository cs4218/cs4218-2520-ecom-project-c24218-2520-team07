import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard UI Tests", () => {
  const adminEmail = "ui@123.com";
  const adminPassword = "uitest";
  const adminName = "UI TEST";

  // Helper to log in as admin
  async function loginAsAdmin(page) {
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email").fill(adminEmail);
    await page.getByPlaceholder("Enter Your Password").fill(adminPassword);
    await page.getByRole("button", { name: "LOGIN" }).click();

    const userNameLocator = page.locator(`text=${adminName}`);
    await userNameLocator.waitFor({ state: "visible", timeout: 5000 });
    return userNameLocator;
  }

  test("login as admin and verify header dropdown", async ({ page }) => {
    const userNameLocator = await loginAsAdmin(page);

    // Verify name is visible
    await expect(userNameLocator).toBeVisible();

    // Verify UI style
    await expect(userNameLocator).toHaveCSS("font-weight", "300");
    await expect(userNameLocator).toHaveCSS("cursor", "pointer");

    // Open dropdown
    await userNameLocator.click();
    const dashboardLink = page.locator("text=Dashboard");
    await expect(dashboardLink).toBeVisible();
  });

  test("navigate to admin dashboard and verify content", async ({ page }) => {
    // Login as admin
    const userNameLocator = await loginAsAdmin(page);
    await userNameLocator.click();

    // Click Dashboard link
    const dashboardLink = page.locator("text=Dashboard");
    await dashboardLink.click();

    // Verify URL
    await expect(page).toHaveURL(/dashboard\/admin/);

    // Verify admin info with actual values
    const adminNameEl = page.getByText("Admin Name : ui test");
    const adminEmailEl = page.getByText("Admin Email : ui@123.com");
    const adminContactEl = page.getByText("Admin Contact : 98273512");

    await expect(adminNameEl).toBeVisible();
    await expect(adminEmailEl).toBeVisible();
    await expect(adminContactEl).toBeVisible();

    // UI style checks
    await expect(adminNameEl).toHaveCSS("font-weight", "500"); // adjust if different
    await expect(adminEmailEl).toHaveCSS("color", "rgb(33, 37, 41)");
    await expect(adminContactEl).toHaveCSS("color", "rgb(33, 37, 41)");
  });

  test("verify admin menu items and their styles", async ({ page }) => {
    const userNameLocator = await loginAsAdmin(page);
    await userNameLocator.click();
    const dashboardLink = page.locator("text=Dashboard");
    await dashboardLink.click();
    await expect(page).toHaveURL(/dashboard\/admin/);

    const menuItems = [
      { name: "Create Category", path: "create-category" },
      { name: "Create Product", path: "create-product" },
      { name: "Products", path: "products" },
      { name: "Orders", path: "orders" },
    ];

    for (const item of menuItems) {
      const menuLocator = page.locator(".dashboard-menu").getByText(item.name);

      // Check visibility
      await expect(menuLocator).toBeVisible();

      // Check style
      await expect(menuLocator).toHaveCSS("color", "rgb(33, 37, 41)");
      await expect(menuLocator).toHaveCSS("cursor", "pointer");

      // Click and verify URL
      await menuLocator.click();
      await expect(page).toHaveURL(new RegExp(item.path));

      // Go back to dashboard for next menu item
      await page.goto("http://localhost:3000/dashboard/admin");
    }
  });
});
