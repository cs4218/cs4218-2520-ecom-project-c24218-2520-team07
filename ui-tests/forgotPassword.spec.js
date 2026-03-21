// Lin Bin A0258760W
import { test, expect } from "@playwright/test";

test.describe("Forgot Password Page UI Tests", () => {
  const baseUrl = "http://localhost:3000";

  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseUrl}/forgot-password`);
  });

  // Test 1: Page loads correctly
  test("should display all input fields and button", async ({ page }) => {
    await expect(page.getByPlaceholder("Enter Your Email")).toBeVisible();
    await expect(
      page.getByPlaceholder("Enter Your Security Answer"),
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("Enter Your New Password"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "RESET PASSWORD" }),
    ).toBeVisible();
  });

  // Test 2: Show error if any field is empty
  test("should show error toast if fields are empty", async ({ page }) => {
    await page.getByRole("button", { name: "RESET PASSWORD" }).click();

    const toast = page.locator('div[role="status"]');
    await toast.waitFor({ state: "visible", timeout: 5000 });
    await expect(toast).toContainText("All fields are required");
  });

  // Test 3: Successful password reset
  test("should reset password successfully with valid data", async ({
    page,
  }) => {
    await page
      .getByPlaceholder("Enter Your Email")
      .fill("test1773298946046@example.com");
    await page.getByPlaceholder("Enter Your Security Answer").fill("Football");
    await page
      .getByPlaceholder("Enter Your New Password")
      .fill("newpassword123");

    await page.getByRole("button", { name: "RESET PASSWORD" }).click();

    const toast = page.locator('div[role="status"]');
    await toast.waitFor({ state: "visible", timeout: 5000 });
    await expect(toast).toContainText("Password Reset Successfully");

    // Check button resets after loading
    await expect(
      page.getByRole("button", { name: "RESET PASSWORD" }),
    ).toBeEnabled();
  });

  // Test 4: Wrong email
  test("should show error toast if email is wrong", async ({ page }) => {
    await page
      .getByPlaceholder("Enter Your Email")
      .fill("nonexistent@example.com");
    await page.getByPlaceholder("Enter Your Security Answer").fill("Football");
    await page
      .getByPlaceholder("Enter Your New Password")
      .fill("newpassword123");

    await page.getByRole("button", { name: "RESET PASSWORD" }).click();

    const toast = page.locator('div[role="status"]');
    await toast.waitFor({ state: "visible", timeout: 5000 });
    await expect(toast).toContainText("Something went wrong");
  });

  // Test 5: Wrong answer
  test("should show error toast if security answer is wrong", async ({
    page,
  }) => {
    await page
      .getByPlaceholder("Enter Your Email")
      .fill("test1773298946046@example.com");
    await page
      .getByPlaceholder("Enter Your Security Answer")
      .fill("WrongAnswer");
    await page
      .getByPlaceholder("Enter Your New Password")
      .fill("newpassword123");

    await page.getByRole("button", { name: "RESET PASSWORD" }).click();

    const toast = page.locator('div[role="status"]');
    await toast.waitFor({ state: "visible", timeout: 5000 });
    await expect(toast).toContainText("Something went wrong");
  });
});
