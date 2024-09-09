import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import { postsTable } from "../schema"
import { eq } from "drizzle-orm"
import { test, expect } from "bun:test"

test("データベースに投票箱を書き込む", async () => {
  const sqlite = new Database()

  const db = drizzle(sqlite)

  migrate(db, { migrationsFolder: "./migrations" })

  const postId = crypto.randomUUID()

  await db.insert(postsTable).values({
    id: postId,
    name: "name",
    deadline: new Date(),
  })

  const post = db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, postId))
    .get()

  expect(post).not.toBeUndefined()
})
