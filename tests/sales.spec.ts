import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("should load the login page and show credentials form", async ({ page }) => {
    // Navigate to the login page
    await page.goto("/login");

    // Check title / logo
    await expect(page.locator("h1")).toContainText(/Iniciar sesión|Crear cuenta/);

    // Check inputs are visible
    const usernameInput = page.locator("input#username");
    const passwordInput = page.locator("input#password");
    const loginButton = page.locator("button#login-btn");

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });
});
