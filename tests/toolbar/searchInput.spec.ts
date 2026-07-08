import { test, expect } from "@playwright/test";

const doLogin = async ({ page }: { page: any }) => {
  await page.goto("/login");

  //Fill credentials
  await page.getByTestId("username").fill("admin");
  await page.getByTestId("password").fill("admin");

  //Click login button
  await page.getByTestId("loginBtn").click();

  //Check that the user is redirected to the home page
  await expect(page).toHaveURL("/");
};

test.describe("Sales Filter", () => {
  test.beforeEach(async ({ page }) => {
    await doLogin({ page });
  });

  test("should load the sales filter", async ({ page }) => {
    // Check if search input is visible
    await expect(page.getByTestId("salesFilter")).toBeVisible();
  });

  test("should do search by client", async ({ page }) => {
    const searchInput = page.getByTestId("salesFilter");

    // Fill search input
    await searchInput.fill("John Doe");

    // Check if search input has value
    await expect(searchInput).toHaveValue("John Doe");

    // Check if search input has clear button
    await expect(page.getByTestId("salesFilter-clearBtn")).toBeVisible();

    // Click clear search button
    await page.getByTestId("salesFilter-clearBtn").click();

    // Check if search input is empty
    await expect(searchInput).toHaveValue("");
  });
});
