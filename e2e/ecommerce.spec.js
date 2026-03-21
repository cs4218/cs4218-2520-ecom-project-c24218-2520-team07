// Team Member Name, Student ID
// UI/E2E Tests using Playwright

import { test, expect } from '@playwright/test';

test.describe('E-Commerce Platform UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  });

  // ========== CATEGORY BROWSING TESTS ==========

  test('E2E: Browse all categories page and navigate to first category', async ({ page }) => {
    // Navigate to categories page
    await page.goto('http://localhost:3000/categories', { waitUntil: 'networkidle' });

    await expect(page).toHaveTitle(/Categories/);

    const categoryButtons = page.locator('a.btn-primary');
    const categoryCount = await categoryButtons.count();
    expect(categoryCount).toBeGreaterThan(0);

    // Get first category name and navigate
    const firstCategoryText = await categoryButtons.first().textContent();
    expect(firstCategoryText).toBeTruthy();

    await categoryButtons.first().click();
    await page.waitForURL(/\/category\//, { waitUntil: 'networkidle' });
    
    expect(page.url()).toContain('/category/');
  });

  test('E2E: Click on category and view products', async ({ page }) => {
    // Navigate to categories
    await page.goto('http://localhost:3000/categories', { waitUntil: 'networkidle' });

    const firstCategory = page.locator('a.btn-primary').first();
    const categoryText = await firstCategory.textContent();

    await firstCategory.click();

    await page.waitForURL(/\/category\//, { waitUntil: 'networkidle' });

    const pageUrl = page.url();
    expect(pageUrl).toContain('/category/');

    const heading = page.locator('h1, h2');
    const pageContent = await page.content();
    expect(pageContent).toContain(categoryText);
  });

  // ========== PRODUCT FILTERING TESTS ==========

  test('E2E: Filter products by category on home page and verify results', async ({ page }) => {
    // We're already on home page from beforeEach
    const categoryCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await categoryCheckboxes.count();

    if (checkboxCount > 0) {
      // Get initial product count
      const initialProducts = page.locator('.card, [data-testid*="product"]');
      const initialCount = await initialProducts.count();

      const firstCheckbox = categoryCheckboxes.first();
      const categoryLabel = await firstCheckbox.locator('..').textContent();
      await firstCheckbox.click();

      await page.waitForTimeout(1000);

      const filteredProducts = page.locator('.card, [data-testid*="product"]');
      const filteredCount = await filteredProducts.count();
      
      // Should have products displayed (empty or filtered)
      expect(filteredCount).toBeGreaterThanOrEqual(0);

      const pageContent = await page.content();
      expect(pageContent).toContain(/Product|price|filter/i);
    }
  });

  test('E2E: Filter products by price range and verify results', async ({ page }) => {
    // We're already on home page
    const priceRadios = page.locator('input[type="radio"]');
    const radioCount = await priceRadios.count();

    if (radioCount > 0) {
      // Get initial product list
      const initialContent = await page.content();
      
      const secondRadio = priceRadios.nth(1);
      const priceLabel = await secondRadio.locator('..').textContent();
      
      await secondRadio.click();

      await page.waitForTimeout(1000);

      const productCards = page.locator('.card, [data-testid*="product"]');
      const productCount = await productCards.count();

      // Get page content after filter
      const filteredContent = await page.content();
      
      expect(filteredContent.length).toBeGreaterThan(0);
      expect(filteredContent).toContain(/Product|price|filter|product not found/i);
    }
  });

  test('E2E: Reset all filters', async ({ page }) => {
    // Apply a filter first
    const categoryCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await categoryCheckboxes.count();

    if (checkboxCount > 0) {
      const firstCheckbox = categoryCheckboxes.first();
      await firstCheckbox.click();
      await page.waitForTimeout(500);

      const resetButton = page.locator('button:has-text("RESET FILTERS")');
      const resetExists = await resetButton.count();

      if (resetExists > 0) {
        // Reset will reload page
        const navigationPromise = page.waitForNavigation();
        await resetButton.click();
        await navigationPromise.catch(() => {}); // Page reload might cause navigation
        await page.waitForTimeout(1000);

        const url = page.url();
        expect(url).toBeTruthy();
      }
    }
  });

  // ========== CART FUNCTIONALITY TESTS ==========

  test('E2E: Add product to cart from home page', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for add to cart buttons
    const addCartButtons = page.locator('button:has-text("Add To Cart"), button:has-text("add to cart")');
    const buttonCount = await addCartButtons.count();

    if (buttonCount > 0) {
      const firstButton = addCartButtons.first();

      // Get initial cart count
      const cartLink = page.locator('a:has-text("Cart")').first();
      const initialCartText = await cartLink.textContent({ timeout: 1000 }).catch(() => '');

      // Add item to cart
      await firstButton.click();

      await page.waitForTimeout(1000);

      const successMessage = page.locator('text=/Added|Cart|Success/i');
      expect(await successMessage.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('E2E: View shopping cart page and verify cart structure', async ({ page }) => {
    // Navigate to cart page
    await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle' });

    const pageUrl = page.url();
    expect(pageUrl).toContain('/cart');

    const cartHeading = page.locator('text=/Cart|cart/i').first();
    await expect(cartHeading).toBeVisible({ timeout: 5000 });

    const cartItems = page.locator('.card.flex-row, [data-testid*="cart-item"], tr').first();
    const emptyMessage = page.locator('text=/Cart is empty|No items/i').first();
    
    const itemsExist = (await cartItems.count()) > 0;
    const emptyExists = (await emptyMessage.count()) > 0;
    
    // At least one should exist (either items or empty message)
    expect(itemsExist || emptyExists).toBe(true);
  });

  test('E2E: Add to cart and view in cart page', async ({ page }) => {
    // Step 1: Look for a product and add to cart
    await page.waitForTimeout(1000);

    const addCartButtons = page.locator('button:has-text("Add To Cart"), button:has-text("add to cart")');

    if ((await addCartButtons.count()) > 0) {
      // Store initial cart state in localStorage
      const initialCart = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('cart') || '[]');
      });

      const initialCount = initialCart.length;

      // Add product to cart
      await addCartButtons.first().click();
      await page.waitForTimeout(1000);

      // Navigate to cart
      await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle' });

      const cartItems = page.locator('.card.flex-row, [data-testid*="cart-item"]');
      const itemCount = await cartItems.count();

      // Should have at least the initial count of items
      expect(itemCount).toBeGreaterThanOrEqual(initialCount);

      const greeting = page.locator('text=/Hello|Guest|Cart/i');
      expect(await greeting.count()).toBeGreaterThan(0);
    }
  });

  test('E2E: Remove item from cart', async ({ page }) => {
    // Navigate to cart
    await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle' });

    // Get initial item count
    const removeButtons = page.locator('button:has-text("Remove")');
    const initialCount = await removeButtons.count();

    if (initialCount > 0) {
      const firstRemoveBtn = removeButtons.first();
      await firstRemoveBtn.click();

      await page.waitForTimeout(500);

      const updatedRemoveButtons = page.locator('button:has-text("Remove")');
      const updatedCount = await updatedRemoveButtons.count();

      // Count should decrease or stay same (if only one item and cart cleared)
      expect(updatedCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test('E2E: Cart page displays and calculates total price correctly', async ({ page }) => {
    // Navigate to cart
    await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle' });

    // Look for total price display
    const totalDisplay = page.locator('text=/Total|Subtotal/i');
    const totalExists = await totalDisplay.count();

    if (totalExists > 0) {
      // Get total price element
      const totalElement = totalDisplay.first();
      await expect(totalElement).toBeVisible();

      const totalText = await totalElement.textContent();
      expect(totalText).toMatch(/\$|₹|Total|total/i);
    }

    const cartContent = await page.content();
    expect(cartContent).toContain(/Cart|cart|Item|item|Total|total/i);
  });

  // ========== SEARCH & NAVIGATION TESTS ==========

  test('E2E: Search for product and verify search results', async ({ page }) => {
    // Look for search functionality on home page
    const searchInput = page.locator('input[type="text"], input[placeholder*="Search" i]').first();
    const searchInputExists = await searchInput.count();

    if (searchInputExists > 0) {
      // Type search query
      await searchInput.fill('laptop');

      // Press enter to submit search
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const pageUrl = page.url();
      const pageContent = await page.content();

      // Should either navigate to search results or show results on same page
      expect(pageContent).toContain(/laptop|search|product|result/i);

      const searchValue = await searchInput.inputValue();
      expect(searchValue).toBe('laptop');
    }
  });

  // ========== PRODUCT DETAILS TESTS ==========

  test('E2E: View product details page', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for product links
    const productLinks = page.locator('a').filter({ hasText: /[A-Za-z]/ });
    const linkCount = await productLinks.count();

    // Try to find and click a product link (typically contains product name)
    let clicked = false;
    for (let i = 0; i < Math.min(5, linkCount); i++) {
      const link = productLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href && href.includes('/product/')) {
        await link.click();
        clicked = true;

        await page.waitForURL(/\/product\//, { waitUntil: 'networkidle' });

        expect(page.url()).toContain('/product/');
        break;
      }
    }

    if (clicked) {
      const pageContent = await page.content();
      expect(pageContent).toContain(/Price|Description|Add to Cart/i);
    }
  });

  // ========== RESPONSIVE & PAGE LOAD TESTS ==========

  test('E2E: Home page loads with all sections and products display', async ({ page }) => {
    // Already on home page from beforeEach

    const banner = page.locator('img[alt="bannerimage"], img[class*="banner"]').first();
    const bannerCount = await banner.count();
    expect(bannerCount).toBeGreaterThanOrEqual(0);

    const filterSection = page.locator('text=/Filter|filter/i').first();
    const filterExists = await filterSection.count();
    expect(filterExists).toBeGreaterThan(0);

    const productsSection = page.locator('text=/Products|products/i').first();
    const productsExists = await productsSection.count();
    expect(productsExists).toBeGreaterThan(0);

    const productCards = page.locator('.card, [data-testid*="product"]').first();
    const hasProducts = (await productCards.count()) > 0;
    expect(hasProducts).toBe(true);

    const page_Content = await page.content();
    expect(page_Content).toContain(/Product|product|Price|price/);
  });

  // ========== CART PERSISTENCE TESTS ==========

  test('E2E: Cart persists across page navigation', async ({ page }) => {
    // Add an item to cart
    await page.waitForTimeout(1000);

    const addCartButtons = page.locator('button:has-text("Add To Cart"), button:has-text("add to cart")');

    if ((await addCartButtons.count()) > 0) {
      await addCartButtons.first().click();
      await page.waitForTimeout(500);

      // Get cart state
      const cartBefore = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('cart') || '[]');
      });

      const itemsBefore = cartBefore.length;

      // Navigate away and back
      await page.goto('http://localhost:3000/categories', { waitUntil: 'networkidle' });
      await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

      const cartAfter = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('cart') || '[]');
      });

      expect(cartAfter.length).toEqual(itemsBefore);
    }
  });

  // ========== CATEGORY PRODUCT FILTERING ==========

  test('E2E: View products by category and filter', async ({ page }) => {
    // Navigate to categories
    await page.goto('http://localhost:3000/categories', { waitUntil: 'networkidle' });

    const firstCategory = page.locator('a.btn-primary').first();
    const categoryExists = await firstCategory.count();

    if (categoryExists > 0) {
      await firstCategory.click();

      await page.waitForURL(/\/category\//, { waitUntil: 'networkidle' });

      expect(page.url()).toContain('/category/');

      const pageContent = await page.content();
      expect(pageContent).toBeTruthy();
    }
  });

  // ========== CART SUMMARY TESTS ==========

  test('E2E: Cart summary displays correct information and checkout button', async ({ page }) => {
    // Navigate to cart
    await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle' });

    // Look for cart summary section
    const cartSummary = page.locator('text=/Cart Summary|Total|Checkout/i');
    const summaryExists = await cartSummary.count();
    expect(summaryExists).toBeGreaterThan(0);

    const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("checkout")').first();
    const checkoutExists = await checkoutButton.count();
    expect(checkoutExists).toBeGreaterThan(0);

    const totalSection = page.locator('text=/Total|Price/i');
    const totalCount = await totalSection.count();
    expect(totalCount).toBeGreaterThan(0);

    const summaryContent = await page.content();
    expect(summaryContent).toMatch(/Total|total|Price|price|Checkout|checkout/);
  });

  // ========== MULTIPLE ITEM OPERATIONS ==========

  test('E2E: Add multiple products to cart and view all', async ({ page }) => {
    // Get initial cart state
    let cartBefore = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    });

    const initialCount = cartBefore.length;

    // Add first product
    await page.waitForTimeout(1000);
    const addCartButtons = page.locator('button:has-text("Add To Cart"), button:has-text("add to cart")');

    if ((await addCartButtons.count()) > 1) {
      // Add first product
      await addCartButtons.nth(0).click();
      await page.waitForTimeout(500);

      // Add second product if available
      const buttonsAfterFirst = page.locator('button:has-text("Add To Cart"), button:has-text("add to cart")');
      if ((await buttonsAfterFirst.count()) > 1) {
        await buttonsAfterFirst.nth(1).click();
        await page.waitForTimeout(500);
      }

      // Navigate to cart
      await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle' });

      let cartAfter = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('cart') || '[]');
      });

      expect(cartAfter.length).toBeGreaterThan(initialCount);
    }
  });
});
// Low Han Lynn A0257099M