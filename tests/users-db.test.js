import test from "ava"
import { usersTable } from "../src/schema.js"
import {
  createUser,
  db,
  getUser,
  getUserByToken,
} from "../src/db.js"

test.beforeEach("delete users", async () => {
  await db.delete(usersTable)
})

test.serial("createUser creates user", async (t) => {
  await createUser("adam", "heslo")

  const users = await db.select().from(usersTable).all()

  t.is(users.length, 1)
})

test.serial("getUser gets user", async (t) => {
  await createUser("adam", "heslo")

  const user = await getUser("adam", "heslo")

  t.is(user.username, "adam")
})

test.serial(
  "createUser also returns the user",
  async (t) => {
    const user = await createUser("adam", "heslo")

    t.is(user.username, "adam")
  }
)

test.serial(
  "getUserByToken gets user by token",
  async (t) => {
    const user = await createUser("adam", "heslo")

    const userByToken = await getUserByToken(user.token)

    t.is(userByToken.id, user.id)
  }
)
