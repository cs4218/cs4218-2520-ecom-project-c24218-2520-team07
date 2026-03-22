// Cleon Tan De Xuan A0252030B
import { test, expect } from "@playwright/test";

test.describe("Header Navigation & Category Dropdown UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/");
  });

  test("navbar brand is visible and navigates to home page", async ({
    page,
  }) => {
    const brand = page.getByRole("link", { name: "🛒 Virtual Vault" });
    await expect(brand).toBeVisible();

    // Navigate away then click brand to return home
    await page.goto("http://localhost:3000/contact");
    await page.getByRole("link", { name: "🛒 Virtual Vault" }).click();
    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test("categories dropdown opens and lists categories from the database", async ({
    page,
  }) => {
    const categoriesLink = page
      .getByRole("link", { name: /categories/i })
      .first();
    await categoriesLink.click();

    const dropdownMenu = page.locator(".dropdown-menu");
    await expect(dropdownMenu).toBeVisible();

    // "All Categories" is always present
    await expect(
      page.getByRole("link", { name: "All Categories" }),
    ).toBeVisible();

    // At least one real category should be listed
    const categoryItems = page.locator(".dropdown-menu .dropdown-item");
    const count = await categoryItems.count();
    expect(count).toBeGreaterThan(1);
  });

  test("clicking a category from dropdown navigates to the correct category page", async ({
    page,
  }) => {
    const categoriesLink = page
      .getByRole("link", { name: /categories/i })
      .first();
    await categoriesLink.click();

    // Get the first real category (skip "All Categories" at index 0)
    const firstCategory = page.locator(".dropdown-menu .dropdown-item").nth(1);
    const categoryName = await firstCategory.textContent();
    await firstCategory.click();

    await expect(page).toHaveURL(/\/category\//);
    await expect(
      page.getByText(new RegExp(`Category - ${categoryName}`, "i")),
    ).toBeVisible();
  });

  test("cart link is visible and navigates to cart page", async ({ page }) => {
    const cartLink = page.getByRole("link", { name: /cart/i });
    await expect(cartLink).toBeVisible();
    await cartLink.click();
    await expect(page).toHaveURL(/\/cart/);
  });

  test("guest user sees Login and Register links in navbar", async ({
    page,
  }) => {
    await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /register/i })).toBeVisible();
  });

  test("logged-in user sees their name in navbar and Logout option", async ({
    page,
  }) => {
    // Register then login to get a valid session
    const email = `navtest${Date.now()}@example.com`;

    await page.goto("http://localhost:3000/register");
    await page.getByPlaceholder("Enter Your Name").fill("Nav Tester");
    await page.getByPlaceholder("Enter Your Email").fill(email);
    await page.getByPlaceholder("Enter Your Password").fill("password123");
    await page.getByPlaceholder("Enter Your Phone").fill("12345678");
    await page.getByPlaceholder("Enter Your Address").fill("123 Nav St");
    await page.locator("#exampleInputDOB1").fill("2000-01-01");
    await page.getByPlaceholder("What is Your Favorite sports").fill("Tennis");
    await page.getByRole("button", { name: "REGISTER" }).click();

    await page.waitForURL(/\/login/);
    await page.getByPlaceholder("Enter Your Email").fill(email);
    await page.getByPlaceholder("Enter Your Password").fill("password123");
    await page.getByRole("button", { name: "LOGIN" }).click();

    await page.waitForURL(/\/$/);

    // Username should appear in the navbar
    await expect(page.getByText("Nav Tester")).toBeVisible();

    // Login and Register links should be gone
    await expect(
      page.getByRole("link", { name: /^login$/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: /register/i }),
    ).not.toBeVisible();

    // Logout option should be accessible in dropdown
    await page.getByText("Nav Tester").click();
    await expect(page.getByRole("link", { name: /logout/i })).toBeVisible();
  });
});
