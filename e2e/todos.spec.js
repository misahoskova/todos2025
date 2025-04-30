import { test, expect } from "@playwright/test"

test("index page has title", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByText("MY TODO APP")).toBeDefined()
})

test("form on index page", async ({ page }) => {
  await page.goto("/")

  await page.getByLabel("Název todo").fill("Test todo")
  await page.getByText("Přidat todo").click()

  await expect(page.getByText("Test E2E")).toBeDefined()
})
