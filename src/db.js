import crypto from "crypto"
import { drizzle } from "drizzle-orm/libsql"
import { eq } from "drizzle-orm"
import { migrate } from "drizzle-orm/libsql/migrator"
import {
  todosTable,
  todosRelations,
  usersTable,
  usersRelations,
} from "./schema.js"

const isTest = process.env.NODE_ENV === "test"

export const db = drizzle({
  connection: isTest ? "file::memory:" : "file:db.sqlite",
})

await migrate(db, { migrationsFolder: "drizzle" })

export const getAllTodos = async () => {
  const results = await db
    .select()
    .from(todosTable)
    .leftJoin(
      usersTable,
      eq(todosTable.userId, usersTable.id)
    )
    .all()

  const todos = results.map((result) => ({
    ...result.todos,
    user: result.users,
  }))

  return todos
}

export const getTodoById = async (id) => {
  const todo = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.id, id))
    .get()

  return todo
}

export const createTodo = async (values) => {
  return await db
    .insert(todosTable)
    .values({
      ...values,
      userId: values.user ? values.user.id : null,
    })
    .returning(todosTable)
    .get()
}

export const updateTodo = async (id, values) => {
  await db
    .update(todosTable)
    .set(values)
    .where(eq(todosTable.id, id))
}

export const deleteTodo = async (id) => {
  await db.delete(todosTable).where(eq(todosTable.id, id))
}

export const createUser = async (username, password) => {
  const salt = crypto.randomBytes(16).toString("hex")
  const hashedPassword = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex")
  const token = crypto.randomBytes(16).toString("hex")

  const user = await db
    .insert(usersTable)
    .values({
      username,
      hashedPassword,
      token,
      salt,
    })
    .returning(usersTable)
    .get()

  return user
}

export const getUser = async (username, password) => {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .get()

  if (!user) return null

  const hashedPassword = crypto
    .pbkdf2Sync(password, user.salt, 100000, 64, "sha512")
    .toString("hex")

  if (user.hashedPassword !== hashedPassword) return null

  return user
}

export const getUserByToken = async (token) => {
  if (!token) return null

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.token, token))
    .get()

  return user
}
