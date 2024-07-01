import { zValidator } from "@hono/zod-validator"
import { drizzle } from "drizzle-orm/d1"
import { Hono } from "hono"
import { array, number, object, string } from "zod"
import { optionsTable, postsTable } from "./schema"
import { eq } from "drizzle-orm"
import { cors } from "hono/cors"

const app = new Hono<{ Bindings: Env }>()

app.use(cors())

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.post(
  "/posts",
  zValidator(
    "json",
    object({
      name: string(),
      deadline: number(),
      maxCount: number(),
      options: array(
        object({
          name: string(),
          value: string(),
        }),
      ),
    }),
  ),
  async (c) => {
    const json = c.req.valid("json")

    const db = drizzle(c.env.DB)

    const postId = crypto.randomUUID()

    await db.insert(postsTable).values({
      id: postId,
      name: json.name,
      deadline: new Date(json.deadline),
      maxCount: json.maxCount,
    })

    for (const option of json.options) {
      await db.insert(optionsTable).values({
        id: crypto.randomUUID(),
        name: option.name,
        value: option.value,
        postId: postId,
      })
    }

    return c.json({ id: postId })
  },
)

app.get("/posts/:box", async (c) => {
  const boxId = c.req.param("box")

  const db = drizzle(c.env.DB)

  const post = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, boxId))
    .get()

  if (!post) {
    return c.status(404)
  }

  return c.json(post)
})

app.post("/posts/:post/votes", (c) => {
  const boxId = c.req.param("box")
  return c.json({ id: boxId })
})

export default app
