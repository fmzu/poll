import { zValidator } from "@hono/zod-validator"
import { drizzle } from "drizzle-orm/d1"
import { Hono } from "hono"
import { array, number, object, string } from "zod"
import { optionsTable, postsTable, votesTable } from "./schema"
import { and, eq } from "drizzle-orm"
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

app.get("/posts/:post", async (c) => {
  const boxId = c.req.param("post")

  const db = drizzle(c.env.DB)

  const post = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, boxId))
    .get()

  if (!post) {
    return c.status(404)
  }

  const allOptions = await db
    .select()
    .from(optionsTable)
    .where(eq(optionsTable.postId, post.id))
    .all()

  const allVotes = await db
    .select()
    .from(votesTable)
    .where(eq(votesTable.postId, post.id))
    .all()

  const options = allOptions.map((option) => {
    const votes = allVotes.filter((vote) => vote.optionId === option.id)
    return { ...option, count: votes.length }
  })
  return c.json({ ...post, options })
})

/**
 * 投票する
 */
app.post(
  "/posts/:post/votes",
  zValidator(
    "json",
    object({
      /**
       * DiscordのユーザーIDなど重複しないもの
       */
      idempotencyKey: string(),
      optionValue: string(),
    }),
  ),
  async (c) => {
    const json = c.req.valid("json")

    const db = drizzle(c.env.DB)

    const postId = c.req.param("post")

    const voteId = crypto.randomUUID()

    const option = await db
      .select()
      .from(optionsTable)
      .where(
        and(
          eq(optionsTable.postId, postId),
          eq(optionsTable.value, json.optionValue),
        ),
      )
      .get()

    if (!option) {
      return c.status(404)
    }

    const existingVote = await db
    .select()
    .from(votesTable)
    .where(
      and(
        eq(votesTable.postId, postId),
        eq(votesTable.idempotencyKey, json.idempotencyKey),
      ),
    )
    .get()

    if (existingVote) {
      // 既存の投票を更新する
      await db.update(votesTable)
        .set({
          id: voteId,
          postId: postId,
          userId: 0,
          idempotencyKey: json.idempotencyKey,
          optionId: option.id,
        })
        .where(eq(votesTable.id, existingVote.id));
      return c.json({ id: voteId });
    }
    
    await db.insert(votesTable).values({
      id: voteId,
      postId: postId,
      userId: 0,
      idempotencyKey: json.idempotencyKey,
      optionId: option.id,
    });
    

    return c.json({ id: voteId })
  },
)

export default app
