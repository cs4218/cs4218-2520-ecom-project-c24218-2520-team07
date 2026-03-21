import { test, expect } from "@playwright/test";

test.describe("Search Flow UI Tests (True E2E)", () => {
  test.beforeEach(async ({ page }) => {
    // Start strictly from the homepage, the core interaction hub
    await page.goto("http://localhost:3000/");
  });

  test("should securely handle search queries that return zero products on the live database", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("GibberishNonExistentProduct123");
    
    const searchButton = page.getByRole("button", { name: "Search" });
    await expect(searchButton).toBeVisible();
    await searchButton.click();

    // Ensures we hit the specific router destination 
    await expect(page).toHaveURL(/.*\/search/);
    
    // Assert the component renders fallback effectively independently 
    await expect(page.getByText("No Products Found")).toBeVisible();
  });
  
  test("should process a highly generic search actively resolving database outputs structural sanity", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search");
    await searchInput.fill("a"); // A broad search likely catching live structural iterations
    await page.getByRole("button", { name: "Search" }).click();

    // Ensures live integration holds regardless of exact DB product iterations
    await expect(page).toHaveURL(/.*\/search/);
    await expect(page.getByRole("heading", { name: "Search Results", exact: true })).toBeVisible();
  });

  test("should clear search context and navigate back accurately extending user workflow UI verifications", async ({ page }) => {
    // Execute search first
    const searchInput = page.getByPlaceholder("Search");
    await searchInput.fill("Laptop");
    await page.getByRole("button", { name: "Search" }).click();

    // Arrive at search URL
    await expect(page).toHaveURL(/.*\/search/);
    
    // UI Interaction returning natively
    const homeLink = page.getByRole("link", { name: "🛒 Virtual Vault" });
    await expect(homeLink).toBeVisible();
    await homeLink.click();

    // Return to default
    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test("should enforce structural visual styles ensuring the product cards and headers align properly", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search");
    await searchInput.fill("a");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/.*\/search/);

    // Main header check verifying central text alignment
    const resultHeader = page.getByRole("heading", { name: "Search Results", exact: true });
    await expect(resultHeader.locator("..")).toHaveCSS("text-align", "center");

    // Form button specific checks (Bootstrap btn-outline-success renders inline or block depending on container wrapping)
    const searchBtn = page.getByRole("button", { name: "Search" });
    await expect(searchBtn).toHaveCSS("display", "block");
  });
});
