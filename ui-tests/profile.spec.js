// Lim Yih Fei A0256993J
import { test, expect } from "@playwright/test";

test.describe("Profile Page UI Tests", () => {
  let userEmail;
  let userPassword = "password123";

  test.describe("Authenticated Scenarios", () => {
    test.beforeEach(async ({ page }) => {
      // 1. Register a fresh user completely isolating the database state for this test
      userEmail = `testuser${Date.now()}@example.com`;
      
      await page.goto("http://localhost:3000/register");
      await page.getByPlaceholder("Enter Your Name").fill("Fresh User");
      await page.getByPlaceholder("Enter Your Email").fill(userEmail);
      await page.getByPlaceholder("Enter Your Password").fill(userPassword);
      await page.getByPlaceholder("Enter Your Phone").fill("12345678");
      await page.getByPlaceholder("Enter Your Address").fill("123 Test St");
      await page.locator("#exampleInputDOB1").fill("2000-01-01");
      // Ensure all required fields from the register schema are met
      await page.getByPlaceholder("What is Your Favorite sports").fill("Tennis");
      
      await page.getByRole("button", { name: "REGISTER" }).click();
      
      // The successful registration redirects to login after throwing a toast
      await page.waitForURL(/\/login/);

      // 2. Perform authentic Login workflow to acquire valid database token natively
      await page.getByPlaceholder("Enter Your Email").fill(userEmail);
      await page.getByPlaceholder("Enter Your Password").fill(userPassword);
      await page.getByRole("button", { name: "LOGIN" }).click();

      await page.waitForURL(/\/$/);

      // 3. Directly navigate to the protected boundary securely 
      await page.goto("http://localhost:3000/dashboard/user/profile");
    });

    test("should render the profile form natively injected with live user database entries", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "USER PROFILE" })).toBeVisible();
      
      // Natively asserts the backend GET user-auth responded accurately and Context populated
      await expect(page.getByPlaceholder("Enter Your Name")).toHaveValue("Fresh User");
      await expect(page.getByPlaceholder("Enter Your Email ")).toHaveValue(userEmail);
      await expect(page.getByPlaceholder("Enter Your Email ")).toBeDisabled(); 
      await expect(page.getByPlaceholder("Enter Your Phone")).toHaveValue("12345678");
      await expect(page.getByPlaceholder("Enter Your Address")).toHaveValue("123 Test St");
      
      const updateButton = page.getByRole("button", { name: "UPDATE" });
      await expect(updateButton).toBeVisible();
    });

    test("should maintain robust CSS styling bounds for the profile form and its components", async ({ page }) => {
      // Form Container Layout Check
      const container = page.locator(".form-container");
      await expect(container).toBeVisible();
      await expect(container).toHaveCSS("display", "flex");
      await expect(container).toHaveCSS("flex-direction", "column");

      // Verify authentic Title styling inherited from AuthStyles
      const title = page.getByRole("heading", { name: "USER PROFILE" });
      await expect(title).toHaveCSS("text-align", "center");

      // Button authentic styling check (Black background, white text, sharp borders)
      const updateButton = page.getByRole("button", { name: "UPDATE" });
      await expect(updateButton).toHaveCSS("background-color", "rgb(0, 0, 0)");
      await expect(updateButton).toHaveCSS("color", "rgb(255, 255, 255)");
      await expect(updateButton).toHaveCSS("border-radius", "0px");
    });

    test("should execute a profile update interacting directly with the real backend", async ({ page }) => {
      // Modify form elements
      await page.getByPlaceholder("Enter Your Name").fill("Updated Live Name");
      await page.getByPlaceholder("Enter Your Phone").fill("87654321");
      await page.getByPlaceholder("Enter Your Address").fill("456 New St Live");
      await page.getByPlaceholder("Enter Your Password").fill("newpassword123");
      
      // Submit real route
      await page.getByRole("button", { name: "UPDATE" }).click();

      // The backend processes the change and front-end handles the react-hot-toast gracefully
      const toast = page.locator('div[role="status"]');
      await toast.waitFor({ state: "visible", timeout: 5000 });
      await expect(toast).toContainText("Profile Updated Successfully");
    });
  });

  test.describe("Unauthenticated Profile Scenarios", () => {
    test("should block routing access to the Profile Dashboard if totally logged out", async ({ page }) => {
      // Intentionally navigating without logging in
      await page.goto("http://localhost:3000/dashboard/user/profile");

      // Verify layout is firmly blocked and routing intercepts the attempt natively
      await expect(page.getByRole("heading", { name: "USER PROFILE" })).not.toBeVisible();
    });
  });
});
