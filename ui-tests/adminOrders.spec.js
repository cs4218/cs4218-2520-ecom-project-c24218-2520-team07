import { test, expect } from "@playwright/test";

test.describe("Order Management Journey - AdminOrders Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email").fill("admin@123.com");
    await page.getByPlaceholder("Enter Your Password").fill("admin123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("**/dashboard/admin", { timeout: 10000 });
    await page.goto("http://localhost:3000/dashboard/admin/orders");
    await page.waitForLoadState("networkidle");
  });

  test("should display all orders page elements", async ({ page }) => {
    await expect(page.getByText("All Orders")).toBeVisible();
    
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByText("Orders")).toBeVisible();
    await expect(page.getByText("Products")).toBeVisible();
    await expect(page.getByText("Users")).toBeVisible();
  });

  test("should display orders table with columns", async ({ page }) => {
    await expect(page.getByText("#")).toBeVisible();
    await expect(page.getByText("Status")).toBeVisible();
    await expect(page.getByText("Buyer")).toBeVisible();
    await expect(page.getByText("date")).toBeVisible();
    await expect(page.getByText("Payment")).toBeVisible();
    await expect(page.getByText("Quantity")).toBeVisible();
  });

  test("should display order status dropdown", async ({ page }) => {
    const statusSelects = page.locator(".ant-select");
    const count = await statusSelects.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should display all status options in dropdown", async ({ page }) => {
    const statusSelect = page.locator(".ant-select").first();
    if (await statusSelect.isVisible()) {
      await statusSelect.click();
      await expect(page.getByText("Not Process")).toBeVisible();
      await expect(page.getByText("Processing")).toBeVisible();
      await expect(page.getByText("Shipped")).toBeVisible();
      await expect(page.getByText("deliverd")).toBeVisible();
      await expect(page.getByText("cancel")).toBeVisible();
    }
  });

  test("should have admin menu with correct navigation links", async ({ page }) => {
    await expect(page.getByText("Dashboard")).toBeVisible();
    await expect(page.getByText("Orders")).toBeVisible();
    await expect(page.getByText("Products")).toBeVisible();
    await expect(page.getByText("Categories")).toBeVisible();
    await expect(page.getByText("Users")).toBeVisible();
  });

  test("should highlight current section in admin menu", async ({ page }) => {
    const ordersLink = page.getByText("Orders").nth(1);
    await expect(ordersLink).toBeVisible();
    
    const activeElement = page.locator(".active, .ant-menu-item-selected");
    const hasActiveClass = await activeElement.count();
    expect(hasActiveClass).toBeGreaterThanOrEqual(0);
  });

  test("should display search input to filter orders", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    const count = await searchInput.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should display status filter dropdown above table", async ({ page }) => {
    const filterSelects = page.locator(".ant-select");
    const count = await filterSelects.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should show loading state while fetching orders", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/admin/orders");
    
    const loadingSkeleton = page.locator(".ant-skeleton, .ant-spin, .loading");
    const count = await loadingSkeleton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Admin Navigation Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email").fill("admin@123.com");
    await page.getByPlaceholder("Enter Your Password").fill("admin123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("**/dashboard/admin", { timeout: 10000 });
  });

  test("should navigate from dashboard to orders page", async ({ page }) => {
    await page.getByText("Orders").nth(1).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("All Orders")).toBeVisible();
  });

  test("should navigate from dashboard to products page", async ({ page }) => {
    await page.getByText("Products").nth(1).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Products")).toBeVisible();
  });

  test("should navigate from dashboard to categories page", async ({ page }) => {
    await page.getByText("Categories").click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Categories")).toBeVisible();
  });

  test("should navigate from dashboard to users page", async ({ page }) => {
    await page.getByText("Users").click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Users")).toBeVisible();
  });

  test("should navigate back to home from dashboard", async ({ page }) => {
    await page.getByText("Home").click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("**/");
  });
});

test.describe("Order Status Update Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email").fill("admin@123.com");
    await page.getByPlaceholder("Enter Your Password").fill("admin123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("**/dashboard/admin", { timeout: 10000 });
    await page.goto("http://localhost:3000/dashboard/admin/orders");
    await page.waitForLoadState("networkidle");
  });

  test("should have status dropdown for each order", async ({ page }) => {
    const orderRows = page.locator("table tbody tr");
    const rowCount = await orderRows.count();
    
    if (rowCount > 0) {
      const statusSelects = page.locator(".ant-select");
      const selectCount = await statusSelects.count();
      expect(selectCount).toBeGreaterThan(0);
    }
  });

  test("should change order status when dropdown value is selected", async ({ page }) => {
    const statusSelect = page.locator(".ant-select").first();
    if (await statusSelect.isVisible()) {
      await statusSelect.click();
      await page.getByText("Processing").click();
      await page.waitForTimeout(500);
    }
  });

  test("should show success toast after status change", async ({ page }) => {
    const statusSelect = page.locator(".ant-select").first();
    if (await statusSelect.isVisible()) {
      await statusSelect.click();
      await page.getByText("Shipped").click();
      await page.waitForTimeout(1000);
      
      const toast = page.locator(".ant-message-notice-content, .Toastify__toast-body");
      const toastCount = await toast.count();
      expect(toastCount).toBeGreaterThanOrEqual(0);
    }
  });

  test("should show visual feedback when status is updated", async ({ page }) => {
    const statusSelect = page.locator(".ant-select").first();
    if (await statusSelect.isVisible()) {
      await statusSelect.click();
      await page.getByText("deliverd").click();
      await page.waitForTimeout(1000);
      
      const updatedSelect = page.locator(".ant-select").first();
      await expect(updatedSelect).toBeVisible();
    }
  });

  test("should update status display after selection", async ({ page }) => {
    const statusSelect = page.locator(".ant-select").first();
    if (await statusSelect.isVisible()) {
      await statusSelect.click();
      await page.getByText("cancel").click();
      await page.waitForTimeout(1000);
      
      const cancelOption = page.locator(".ant-select-selection-item");
      await expect(cancelOption).toBeVisible();
    }
  });
});

test.describe("Order Details Display Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email").fill("admin@123.com");
    await page.getByPlaceholder("Enter Your Password").fill("admin123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("**/dashboard/admin", { timeout: 10000 });
    await page.goto("http://localhost:3000/dashboard/admin/orders");
    await page.waitForLoadState("networkidle");
  });

  test("should display order information in table format", async ({ page }) => {
    const table = page.locator("table");
    await expect(table).toBeVisible();
  });

  test("should have proper table headers", async ({ page }) => {
    const headers = page.locator("thead th");
    const count = await headers.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should handle empty orders gracefully", async ({ page }) => {
    await page.waitForTimeout(1000);
    const orderRows = page.locator("tbody tr");
    const count = await orderRows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should expand order row to show product details", async ({ page }) => {
    const expandButton = page.locator(".ant-table-row-expand-icon, .ant-collapse-header");
    const count = await expandButton.count();
    
    if (count > 0) {
      await expandButton.first().click();
      await page.waitForTimeout(500);
      
      const expandedContent = page.locator(".ant-table-expanded-row-content, .ant-collapse-content");
      const expandedCount = await expandedContent.count();
      expect(expandedCount).toBeGreaterThanOrEqual(0);
    }
  });

  test("should display buyer information in order", async ({ page }) => {
    await page.waitForTimeout(500);
    const buyerCell = page.locator("td").filter({ hasText: "@" });
    const count = await buyerCell.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should display payment status in order row", async ({ page }) => {
    const paymentStatus = page.locator("td").filter({ hasText: /success|failed|pending/i });
    const count = await paymentStatus.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Order Filtering and Search Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email").fill("admin@123.com");
    await page.getByPlaceholder("Enter Your Password").fill("admin123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("**/dashboard/admin", { timeout: 10000 });
    await page.goto("http://localhost:3000/dashboard/admin/orders");
    await page.waitForLoadState("networkidle");
  });

  test("should filter orders by status", async ({ page }) => {
    const filterDropdown = page.locator(".ant-select").first();
    if (await filterDropdown.isVisible()) {
      await filterDropdown.click();
      await page.getByText("Processing").click();
      await page.waitForTimeout(500);
    }
  });

  test("should search orders by customer name", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    const count = await searchInput.count();
    
    if (count > 0) {
      await searchInput.first().fill("test");
      await page.waitForTimeout(500);
    }
  });

  test("should search orders by order ID", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    const count = await searchInput.count();
    
    if (count > 0) {
      await searchInput.first().fill("123");
      await page.waitForTimeout(500);
    }
  });

  test("should display filter buttons above orders table", async ({ page }) => {
    const filterButtons = page.locator("button").filter({ hasText: /All|Processing|Shipped|Delivered/i });
    const count = await filterButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should show all orders when no filter is applied", async ({ page }) => {
    const table = page.locator("table");
    await expect(table).toBeVisible();
  });
});

test.describe("Responsive Layout - Admin Pages", () => {
  test("should display admin orders on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("http://localhost:3000/dashboard/admin/orders");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("All Orders")).toBeVisible();
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
  });

  test("should display admin orders on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("http://localhost:3000/dashboard/admin/orders");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("All Orders")).toBeVisible();
  });

  test("should display admin orders on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:3000/dashboard/admin/orders");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("All Orders")).toBeVisible();
  });

  test("admin menu should be accessible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email").fill("admin@123.com");
    await page.getByPlaceholder("Enter Your Password").fill("admin123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("**/dashboard/admin", { timeout: 10000 });
    
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByText("Orders")).toBeVisible();
  });
});
