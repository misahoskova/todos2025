import test from "ava"
import { migrate } from "drizzle-orm/libsql/migrator"
import {
  db,
  getTodoById,
  getAllTodos,
  updateTodo,
  deleteTodo,
} from "../src/app.js"
import { todosTable } from "../src/schema.js"

test.before("run migrations", async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
  await db.delete(todosTable)
})

test.beforeEach("delete table values", async () => {
  await db.delete(todosTable)
})

test("getTodoById returns correct todo", async (t) => {
  const inserted = await db
    .insert(todosTable)
    .values({
      title: "testovaci todo pro test 1",
      done: false,
    })
    .returning()

  const id = inserted[0].id

  const todo = await getTodoById(id)

  t.is(todo.title, "testovaci todo pro test 1")
})

test("getAllTodos returns all todos", async (t) => {
  await db
    .insert(todosTable)
    .values([
      { title: "todo 1", done: false },
      { title: "todo 2", done: true },
    ])
    .returning()

  const todos = await getAllTodos()
  console.log("Todos in table:", todos)

  t.is(todos.length, 2)
  t.is(todos[0].title, "todo 1")
  t.is(todos[1].title, "todo 2")
})

test("updateTodo updates todo correctly", async (t) => {
  const inserted = await db
    .insert(todosTable)
    .values({
      title: "testovaci todo pro update",
      done: false,
    })
    .returning()

  const id = inserted[0].id

  await updateTodo(id, {
    title: "updatovane todo",
    done: true,
  })

  const updatedTodo = await getTodoById(id)

  t.is(updatedTodo.title, "updatovane todo")
  t.true(updatedTodo.done)
})

test("deleteTodo deletes todo correctly", async (t) => {
  const inserted = await db
    .insert(todosTable)
    .values({
      title: "testovaci todo pro delete",
      done: false,
    })
    .returning()

  const id = inserted[0].id

  await deleteTodo(id)

  const deletedTodo = await getTodoById(id)

  t.is(deletedTodo, undefined)
})
