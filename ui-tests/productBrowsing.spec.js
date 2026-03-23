// Cleon Tan De Xuan A0252030B
import { test, expect } from "@playwright/test";

test.describe("Product Browsing Flow UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/");
  });

  test("home page loads and displays products", async ({ page }) => {
    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByText("🛒 Virtual Vault")).toBeVisible();

    // Products section should be visible
    const productCards = page.locator(".card");
    await expect(productCards.first()).toBeVisible();
  });

  test("clicking a category navigates to category page and shows filtered products", async ({
    page,
  }) => {
    // Open the categories dropdown
    const categoriesDropdown = page
      .getByRole("link", { name: /categories/i })
      .first();
    await categoriesDropdown.click();

    // Wait for dropdown menu to appear and pick the first real category (not "All Categories")
    const categoryLinks = page.locator(".dropdown-menu .dropdown-item");
    await expect(categoryLinks.first()).toBeVisible();

    // Click the second item (first real category, skipping "All Categories")
    const firstCategory = categoryLinks.nth(1);
    const categoryName = await firstCategory.textContent();
    await firstCategory.click();

    // Verify navigation to category page
    await expect(page).toHaveURL(/\/category\//);
    await expect(
      page.getByText(new RegExp(`Category - ${categoryName}`, "i")),
    ).toBeVisible();
  });

  test("clicking a product card navigates to product details page", async ({
    page,
  }) => {
    // Wait for products to load
    const moreDetailsBtn = page
      .getByRole("button", { name: /more details/i })
      .first();
    await expect(moreDetailsBtn).toBeVisible();
    await moreDetailsBtn.click();

    // Should navigate to product details page
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByText("Product Details")).toBeVisible();
  });

  test("product details page shows correct product information", async ({
    page,
  }) => {
    // Navigate to a product
    const moreDetailsBtn = page
      .getByRole("button", { name: /more details/i })
      .first();
    await moreDetailsBtn.click();

    await expect(page).toHaveURL(/\/product\//);

    // Verify key product info elements are present
    await expect(page.getByText(/Name\s*:/)).toBeVisible();
    await expect(page.getByText(/Description\s*:/)).toBeVisible();
    await expect(page.getByText(/Price\s*:/)).toBeVisible();
    await expect(page.getByText(/Category\s*:/)).toBeVisible();
  });

  test("similar products section is visible on product details page", async ({
    page,
  }) => {
    const moreDetailsBtn = page
      .getByRole("button", { name: /more details/i })
      .first();
    await moreDetailsBtn.click();

    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByText("Similar Products ➡️")).toBeVisible();
  });

  test("clicking a similar product navigates to a new product details page", async ({
    page,
  }) => {
    // Go to a product page first
    const moreDetailsBtn = page
      .getByRole("button", { name: /more details/i })
      .first();
    await moreDetailsBtn.click();

    await expect(page).toHaveURL(/\/product\//);
    const firstUrl = page.url();

    // Check if similar products exist
    const similarProductBtn = page
      .locator(".similar-products")
      .getByRole("button", { name: /more details/i })
      .first();
    const hasSimilarProducts = await similarProductBtn
      .isVisible()
      .catch(() => false);

    if (hasSimilarProducts) {
      await similarProductBtn.click();
      await expect(page).toHaveURL(/\/product\//);
      // URL should have changed to a different product
      expect(page.url()).not.toBe(firstUrl);
    } else {
      await expect(page.getByText("No Similar Products found")).toBeVisible();
    }
  });
});
