// Lin Bin A0258760W
import { test, expect } from "@playwright/test";

test.describe("Login Page UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
  });

  // Test 1: Login form renders correctly
  test("should display login form elements", async ({ page }) => {
    await expect(page.getByText("LOGIN FORM")).toBeVisible();

    await expect(page.getByPlaceholder("Enter Your Email")).toBeVisible();
    await expect(page.getByPlaceholder("Enter Your Password")).toBeVisible();

    await expect(page.getByRole("button", { name: "LOGIN" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Forgot Password" }),
    ).toBeVisible();
  });

  // Test 2: Check UI styles
  test("should apply correct styles to login button", async ({ page }) => {
    const loginButton = page.getByRole("button", { name: "LOGIN" });

    await expect(loginButton).toHaveCSS("background-color", "rgb(0, 0, 0)");
    await expect(loginButton).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(loginButton).toHaveCSS("border-radius", "0px");
  });

  // Test 3: Check form container style
  test("form container should have correct layout style", async ({ page }) => {
    const container = page.locator(".form-container");

    await expect(container).toBeVisible();
    await expect(container).toHaveCSS("display", "flex");
    await expect(container).toHaveCSS("flex-direction", "column");
  });

  // Test 4: Successful login
  test("should login successfully with valid credentials", async ({ page }) => {
    await page.getByPlaceholder("Enter Your Email").fill("ui@123.com");
    await page.getByPlaceholder("Enter Your Password").fill("uitest");

    await page.getByRole("button", { name: "LOGIN" }).click();

    // Check redirect after login
    await expect(page).toHaveURL(/\/$/);
  });

  // Test 5: Failed login
  test("should show error with invalid credentials", async ({ page }) => {
    await page.getByPlaceholder("Enter Your Email").fill("wrong@email.com");
    await page.getByPlaceholder("Enter Your Password").fill("wrongpassword");

    await page.getByRole("button", { name: "LOGIN" }).click();

    // Expect error toast
    await expect(page.getByText(/invalid|error|wrong/i)).toBeVisible();
  });

  // Test 6: Navigate to forgot password page
  test("should navigate to forgot password page", async ({ page }) => {
    await page.getByRole("button", { name: "Forgot Password" }).click();

    await expect(page).toHaveURL(/forgot-password/);
  });
});
