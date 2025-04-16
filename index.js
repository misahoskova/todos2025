import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { logger } from "hono/logger"
import { serveStatic } from "@hono/node-server/serve-static"
import { renderFile } from "ejs"
import { drizzle } from "drizzle-orm/libsql"
import { todosTable } from "./src/schema.js"
import { eq } from "drizzle-orm"
import { createNodeWebSocket } from "@hono/node-ws"
import { WSContext } from "hono/ws"

const db = drizzle({
  connection: "file:db.sqlite",
  logger: true,
})

const app = new Hono()

const { injectWebSocket, upgradeWebSocket } =
  createNodeWebSocket({ app })

app.use(logger())
app.use(serveStatic({ root: "public" }))

app.get("/", async (c) => {
  const todos = await db.select().from(todosTable).all()

  const index = await renderFile("views/index.html", {
    title: "ÚKOLNÍČEK",
    todos,
  })

  return c.html(index)
})

app.post("/todos", async (c) => {
  const form = await c.req.formData()
  const title = form.get("title")
  const priority = form.get("priority") || "normal"

  await db.insert(todosTable).values({
    title,
    done: false,
    priority,
  })

  return c.redirect("/")
})

app.get("/todos/:id", async (c) => {
  const id = Number(c.req.param("id"))
  const todo = await getTodoById(id)

  if (!todo) return c.notFound()

  const detail = await renderFile("views/detail.html", {
    todo,
  })

  sendTodosToAllConnections()

  return c.html(detail)
})

app.post("/todos/:id", async (c) => {
  const id = Number(c.req.param("id"))

  const todo = await getTodoById(id)

  if (!todo) return c.notFound()

  const form = await c.req.formData()

  await db
    .update(todosTable)
    .set({ title: form.get("title") })
    .where(eq(todosTable.id, id))

  sendTodosToAllConnections()
  sendTodoDetailtoAllConnections(id)

  return c.redirect(c.req.header("Referer"))
})

app.post("/todos/:id/rename", async (c) => {
  const id = Number(c.req.param("id"))
  const form = await c.req.formData()
  const newTitle = form.get("title")
  const newPriority = form.get("priority")

  const todo = await getTodoById(id)
  if (!todo) return c.notFound()

  await db
    .update(todosTable)
    .set({ title: newTitle, priority: newPriority })
    .where(eq(todosTable.id, id))

  sendTodosToAllConnections()
  sendTodoDetailtoAllConnections(id)

  return c.redirect(`/todos/${id}`)
})

app.get("/todos/:id/toggle", async (c) => {
  const id = Number(c.req.param("id"))

  const todo = await getTodoById(id)

  if (!todo) return c.notFound()

  await db
    .update(todosTable)
    .set({ done: !todo.done })
    .where(eq(todosTable.id, id))

  for (const connection of connections.values()) {
    connection.send("updated")
  }

  sendTodosToAllConnections()
  sendTodoDetailtoAllConnections(id)

  return c.redirect(c.req.header("Referer"))
})

app.get("/todos/:id/remove", async (c) => {
  const id = Number(c.req.param("id"))

  const todo = await getTodoById(id)

  if (!todo) return c.notFound()

  await db.delete(todosTable).where(eq(todosTable.id, id))

  sendTodosToAllConnections()
  sendTodoDeletedToAllConnections(id)

  return c.redirect("/")
})

/** @type{Set<WSContext<WebSocket>>} */
const connection = new Set()

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    console.log(c.req.path)

    return {
      onOpen: (evt, ws) => {
        connections.add(ws)
        connection = ws.send("Hello from server")
      },
      onClose: (evt, ws) => {
        connection.delete(ws)
        console.log("close")
      },
      onMessage: (evt, ws) => {
        console.log("onMessage", evt.data)
      },
    }
  })
)

const server = serve(app, (info) => {
  console.log(
    `App started on http://localhost:${info.port}`
  )
})

injectWebSocket(server)

const getTodoById = async (id) => {
  const todo = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.id, id))
    .get()

  return todo
}

const sendTodosToAllConnections = async () => {
  const todos = await db.select().from(todosTable).all()

  const rendered = await renderFile("views/todos.html", {
    todos,
  })
  for (const connection of connections.values()) {
    const data = JSON.stringify([
      {
        type: "todos",
        data: rendered,
      },
    ])

    connection.send(data)
  }
}

const sendTodoDetailtoAllConnections = async (id) => {
  const todo = await getTodoById(id)

  const rendered = await renderFile("views/_todo.html", {
    todo,
  })
  for (const connection of connections.values()) {
    const data = JSON.stringify([
      {
        type: "todo",
        data: rendered,
      },
    ])

    connection.send(data)
  }
}

const sendTodoDeletedToAllConnections = async (id) => {
  for (const connection of connections.values()) {
    const data = JSON.stringify([
      {
        type: "todoDeleted",
        id,
      },
    ])

    connection.send(data)
  }
}
