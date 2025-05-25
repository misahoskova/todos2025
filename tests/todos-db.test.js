import test from "ava"
import {
  createTodo,
  db,
  deleteTodo,
  getAllTodos,
  getTodoById,
  updateTodo,
} from "../src/db.js"
import { todosTable } from "../src/schema.js"

test.beforeEach("delete todos", async () => {
  await db.delete(todosTable)
})

test.serial("getTodoById returns id", async (t) => {
  await db
    .insert(todosTable)
    .values({ id: 1, title: "testovaci todo", done: false })

  const todo = await getTodoById(1)

  t.is(todo.title, "testovaci todo")
})

test.serial("getAllTodos returns all todos", async (t) => {
  await db.insert(todosTable).values([
    { title: "testovaci todo 1", done: false },
    { title: "testovaci todo 2", done: false },
    { title: "testovaci todo 3", done: false },
  ])

  const todos = await getAllTodos()

  t.is(todos.length, 3)
})

test.serial("createTodo creates todo", async (t) => {
  await createTodo({ title: "created todo", done: false })

  const todos = await getAllTodos()

  t.is(todos[0].title, "created todo")
})

test.serial("updateTodo updates todo", async (t) => {
  await createTodo({ id: 1, title: "a", done: false })

  await updateTodo(1, { title: "b", done: true })

  const todo = await getTodoById(1)

  t.is(todo.title, "b")
  t.is(todo.done, true)
})

test.serial("deleteTodo deletes todo", async (t) => {
  await createTodo({ title: "a", done: false })

  const todosBefore = await getAllTodos()

  t.is(todosBefore.length, 1)

  await deleteTodo(todosBefore[0].id)

  const todosAfter = await getAllTodos()

  t.is(todosAfter.length, 0)
})
