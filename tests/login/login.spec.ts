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

  test("should do login with credentials", async({page}) =>{
    //Navigate to login page
    await page.goto("/login");

    //Fill credentials
    await page.getByTestId("username").fill("admin");
    await page.getByTestId("password").fill("admin");
    
    //Click login button
    await page.getByTestId("loginBtn").click();

    //Check that the user is redirected to the home page
    await expect(page).toHaveURL("/");
  });

  test("should not do login with empty credentials", async({page}) =>{
    //Navigate to login page
    await page.goto("/login");

    //Click login button
    await page.getByTestId("loginBtn").click();

    //Check that the user is redirected to the login page
    await expect(page).toHaveURL("/login");
  });
});
