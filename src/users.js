import { renderFile } from "ejs"
import { Hono } from "hono"
import { createUser, db, getUser } from "./db.js"
import { setCookie } from "hono/cookie"
import { todosTable } from "./schema.js"
import { eq } from "drizzle-orm"

export const usersRouter = new Hono()

const onlyForUsers = async (c, next) => {
  const user = c.get("user")
  if (!user) return c.notFound()
  await next()
}

usersRouter.get("/register", async (c) => {
  const rendered = await renderFile("views/register.html")

  return c.html(rendered)
})

usersRouter.post("/register", async (c) => {
  const form = await c.req.formData()

  const user = await createUser(
    form.get("username"),
    form.get("password")
  )

  setCookie(c, "token", user.token)

  return c.redirect("/")
})

usersRouter.get("/login", async (c) => {
  const rendered = await renderFile("views/login.html")

  return c.html(rendered)
})

usersRouter.post("/login", async (c) => {
  const form = await c.req.formData()

  const user = await getUser(
    form.get("username"),
    form.get("password")
  )

  if (!user) return c.notFound()

  setCookie(c, "token", user.token)

  return c.redirect("/")
})

usersRouter.get("/mytodos", onlyForUsers, async (c) => {
  const user = c.get("user")

  const todos = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.userId, user.id))
    .all()

  const index = await renderFile("views/index.html", {
    title: `Todos of ${user.username}`,
    todos,
    user: c.get("user"),
  })

  return c.html(index)
})
