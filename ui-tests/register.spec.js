// Lin Bin A0258760W
import { test, expect } from "@playwright/test";

test.describe("Register Page UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/register");
  });

  // Test 1: Check that register form renders correctly
  test("should display register form elements", async ({ page }) => {
    await expect(page.locator(".title")).toHaveText("REGISTER FORM");

    await expect(page.getByPlaceholder("Enter Your Name")).toBeVisible();
    await expect(page.getByPlaceholder("Enter Your Email")).toBeVisible();
    await expect(page.getByPlaceholder("Enter Your Password")).toBeVisible();
    await expect(page.getByPlaceholder("Enter Your Phone")).toBeVisible();
    await expect(page.getByPlaceholder("Enter Your Address")).toBeVisible();
    await expect(
      page.getByPlaceholder("What is Your Favorite sports"),
    ).toBeVisible();

    await expect(page.getByRole("button", { name: "REGISTER" })).toBeVisible();
  });

  // Test 2: Check title styling
  test("title should have bold styling", async ({ page }) => {
    const title = page.locator(".title");

    await expect(title).toHaveText("REGISTER FORM");
    await expect(title).toHaveCSS("font-weight", "700");
  });

  // Test 3: Check container styles
  test("form container should have correct styles", async ({ page }) => {
    const container = page.locator(".form-container");

    await expect(container).toBeVisible();
    await expect(container).toHaveCSS("display", "flex");
    await expect(container).toHaveCSS("flex-direction", "column");
  });

  // Test 4: Check register button styles
  test("register button should have correct styles", async ({ page }) => {
    const registerButton = page.getByRole("button", { name: "REGISTER" });

    await expect(registerButton).toHaveCSS("background-color", "rgb(0, 0, 0)");
    await expect(registerButton).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(registerButton).toHaveCSS("border-radius", "0px");
  });

  // Test 5: Successful registration with toast check
  test("should register successfully with valid data and show toast", async ({
    page,
  }) => {
    await page.getByPlaceholder("Enter Your Name").fill("Test User");
    await page
      .getByPlaceholder("Enter Your Email")
      .fill(`test${Date.now()}@example.com`);
    await page.getByPlaceholder("Enter Your Password").fill("password123");
    await page.getByPlaceholder("Enter Your Phone").fill("12345678");
    await page.getByPlaceholder("Enter Your Address").fill("Singapore");
    await page.locator("#exampleInputDOB1").fill("2000-01-01");
    await page
      .getByPlaceholder("What is Your Favorite sports")
      .fill("Football");

    await page.getByRole("button", { name: "REGISTER" }).click();

    // Wait for toast notification to appear
    const successToast = page.locator('div[role="status"]');
    await successToast.waitFor({ state: "visible", timeout: 5000 });
    await expect(successToast).toContainText(
      "Register Successfully, please login",
    );

    // Expect redirect to login page
    await expect(page).toHaveURL(/login/);
  });

  // Test 6: Required fields validation
  test("should prevent submission if fields are empty", async ({ page }) => {
    const registerButton = page.getByRole("button", { name: "REGISTER" });

    await registerButton.click();

    const nameInput = page.getByPlaceholder("Enter Your Name");

    const isInvalid = await nameInput.evaluate((el) => !el.checkValidity());

    expect(isInvalid).toBeTruthy();
  });

  // Test 7: User already exists
  test("should show error toast if user already exists", async ({ page }) => {
    const existingEmail = "ui@123.com";
    await page.getByPlaceholder("Enter Your Name").fill("Test User");
    await page.getByPlaceholder("Enter Your Email").fill(existingEmail);
    await page.getByPlaceholder("Enter Your Password").fill("password123");
    await page.getByPlaceholder("Enter Your Phone").fill("12345678");
    await page.getByPlaceholder("Enter Your Address").fill("Singapore");
    await page.locator("#exampleInputDOB1").fill("2000-01-01");
    await page
      .getByPlaceholder("What is Your Favorite sports")
      .fill("Football");

    await page.getByRole("button", { name: "REGISTER" }).click();

    // Wait for error toast
    const errorToast = page.locator('div[role="status"]');
    await errorToast.waitFor({ state: "visible", timeout: 5000 });
    await expect(errorToast).toContainText("Already Register please login");

    // Should remain on register page
    await expect(page).toHaveURL(/register/);
  });
});
