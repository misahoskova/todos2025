import { testClient } from "hono/testing"
import { app } from "../src/app.js"
import { migrate } from "drizzle-orm/libsql/migrator"
import { db } from "../src/app.js"
import { todosTable } from "../src/schema.js"
import test from "ava"

const client = testClient(app)

test.before("run migrations", async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
  await db.delete(todosTable)
})

test.beforeEach("delete table values", async () => {
  await db.delete(todosTable)
})

test.serial("GET / returns index with title", async (t) => {
  const response = await client["/"].$get()
  const text = await response.text()

  t.assert(text.includes("<h1>MY TODO APP</h1>"))
})
