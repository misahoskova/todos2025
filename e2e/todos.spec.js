import { test, expect } from "@playwright/test"

test("index page has title", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByText("MY TODO APP")).toBeDefined()
})

test("form on index page creates new todos", async ({
  page,
}) => {
  await page.goto("/")

  await page.getByLabel("Název todo").fill("E2E todo")
  await page.getByText("Přidat todo").click()

  await expect(page.getByText("E2E todo")).toBeDefined()
})
