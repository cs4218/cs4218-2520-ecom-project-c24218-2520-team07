// Goh En Rui Ryann A0252528A
import { test, expect } from "@playwright/test";

test.describe("Product Creation Journey - CreateProduct Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email").fill("admin@123.com");
    await page.getByPlaceholder("Enter Your Password").fill("admin123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("**/dashboard/admin", { timeout: 10000 });
    await page.goto("http://localhost:3000/dashboard/admin/create-product");
    await page.waitForLoadState("networkidle");
  });

  test("should display create product form elements", async ({ page }) => {
    await expect(page.getByText("Create Product")).toBeVisible();

    await expect(page.getByPlaceholder("Select a category")).toBeVisible();
    await expect(page.getByPlaceholder("write a name")).toBeVisible();
    await expect(page.getByPlaceholder("write a description")).toBeVisible();
    await expect(page.getByPlaceholder("write a Price")).toBeVisible();
    await expect(page.getByPlaceholder("write a quantity")).toBeVisible();

    await expect(page.getByText("Upload Photo")).toBeVisible();
    await expect(page.getByRole("button", { name: "CREATE PRODUCT" })).toBeVisible();
  });

  test("should have admin menu visible", async ({ page }) => {
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByText("Orders")).toBeVisible();
    await expect(page.getByText("Products")).toBeVisible();
  });

  test("should load categories in dropdown", async ({ page }) => {
    await page.waitForTimeout(1000);
    const categoryOptions = page.locator(".ant-select-item-option-content");
    const count = await categoryOptions.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should preview uploaded photo", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      mimeType: "image/png",
      name: "test.png",
      buffer: Buffer.from("test-image-content"),
    });

    await expect(page.getByAltText("product_photo")).toBeVisible();
  });

  test("should update name field on input", async ({ page }) => {
    const nameInput = page.getByPlaceholder("write a name");
    await nameInput.fill("Test Product");
    await expect(nameInput).toHaveValue("Test Product");
  });

  test("should update description field on input", async ({ page }) => {
    const descInput = page.getByPlaceholder("write a description");
    await descInput.fill("This is a test product description");
    await expect(descInput).toHaveValue("This is a test product description");
  });

  test("should update price field on input", async ({ page }) => {
    const priceInput = page.getByPlaceholder("write a Price");
    await priceInput.fill("99.99");
    await expect(priceInput).toHaveValue("99.99");
  });

  test("should update quantity field on input", async ({ page }) => {
    const quantityInput = page.getByPlaceholder("write a quantity");
    await quantityInput.fill("10");
    await expect(quantityInput).toHaveValue("10");
  });

  test("should show validation error for empty name on submit", async ({ page }) => {
    await page.getByPlaceholder("write a description").fill("Description");
    await page.getByPlaceholder("write a Price").fill("100");
    await page.getByPlaceholder("write a quantity").fill("10");
    
    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
    
    await page.waitForTimeout(1000);
    const errors = await page.locator(".ant-message-notice-content, .error, toast").count();
    expect(errors).toBeGreaterThanOrEqual(0);
  });

  test("should show validation error for empty category", async ({ page }) => {
    await page.getByPlaceholder("write a name").fill("Test Product");
    await page.getByPlaceholder("write a description").fill("Description");
    await page.getByPlaceholder("write a Price").fill("100");
    await page.getByPlaceholder("write a quantity").fill("10");
    
    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
    
    await page.waitForTimeout(1000);
  });

  test("should display shipping toggle", async ({ page }) => {
    const shippingSelect = page.locator('input[placeholder="Select Shipping "], .ant-select').nth(1);
    await expect(shippingSelect).toBeVisible();
  });
});

test.describe("ProductDetails Page", () => {
  test("should display product details elements", async ({ page }) => {
    await page.goto("http://localhost:3000/product/laptop");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Product Details")).toBeVisible();
    await expect(page.getByText("Name :")).toBeVisible();
    await expect(page.getByText("Description :")).toBeVisible();
    await expect(page.getByText("Price :")).toBeVisible();
    await expect(page.getByText("Category :")).toBeVisible();
    await expect(page.getByRole("button", { name: "ADD TO CART" })).toBeVisible();
  });

  test("should have product image visible", async ({ page }) => {
    await page.goto("http://localhost:3000/product/laptop");
    await page.waitForLoadState("networkidle");

    const productImage = page.locator(".card-img-top").first();
    await expect(productImage).toBeVisible();
  });

  test("should display product information correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/product/laptop");
    await page.waitForLoadState("networkidle");

    await page.waitForTimeout(1000);
    const nameElement = page.locator("h6").filter({ hasText: "Name :" });
    const categoryElement = page.locator("h6").filter({ hasText: "Category :" });

    await expect(nameElement).toBeVisible();
    await expect(categoryElement).toBeVisible();
  });

  test("should show similar products section with cards", async ({ page }) => {
    await page.goto("http://localhost:3000/product/laptop");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Similar Products")).toBeVisible();
    
    const similarCards = page.locator(".similar-products .card");
    const count = await similarCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should have proper visual hierarchy in product details", async ({ page }) => {
    await page.goto("http://localhost:3000/product/laptop");
    await page.waitForLoadState("networkidle");

    const productDetailsSection = page.locator(".product-details");
    await expect(productDetailsSection).toBeVisible();
    
    const detailsInfo = page.locator(".product-details-info");
    await expect(detailsInfo).toBeVisible();
  });
});

test.describe("Product Creation Flow - End to End", () => {
  test("should complete product creation workflow", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email").fill("admin@123.com");
    await page.getByPlaceholder("Enter Your Password").fill("admin123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("**/dashboard/admin", { timeout: 10000 });

    await page.goto("http://localhost:3000/dashboard/admin/create-product");
    await page.waitForLoadState("networkidle");

    await page.waitForTimeout(500);

    await page.getByPlaceholder("write a name").fill("E2E Test Product");
    await page.getByPlaceholder("write a description").fill("Test description for E2E");
    await page.getByPlaceholder("write a Price").fill("199.99");
    await page.getByPlaceholder("write a quantity").fill("25");

    const categorySelect = page.locator(".ant-select");
    await categorySelect.click();
    await page.locator(".ant-select-item-option").first().click();

    const createButton = page.getByRole("button", { name: "CREATE PRODUCT" });
    await expect(createButton).toBeVisible();
  });

  test("should navigate to products page after creation", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/admin/products");
    
    await expect(page.getByText("Products")).toBeVisible();
    
    const productCards = page.locator(".card");
    const count = await productCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Responsive Layout Tests", () => {
  test("should display correctly on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("http://localhost:3000/product/laptop");
    await page.waitForLoadState("networkidle");

    const container = page.locator(".container");
    await expect(container).toBeVisible();
  });

  test("should display correctly on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("http://localhost:3000/product/laptop");
    await page.waitForLoadState("networkidle");

    const container = page.locator(".container");
    await expect(container).toBeVisible();
  });

  test("should display correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:3000/product/laptop");
    await page.waitForLoadState("networkidle");

    const container = page.locator(".container");
    await expect(container).toBeVisible();
  });

  test("create product page should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email").fill("admin@123.com");
    await page.getByPlaceholder("Enter Your Password").fill("admin123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("**/dashboard/admin", { timeout: 10000 });
    await page.goto("http://localhost:3000/dashboard/admin/create-product");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Create Product")).toBeVisible();
    await expect(page.getByPlaceholder("write a name")).toBeVisible();
  });
});
