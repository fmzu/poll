import { zValidator } from "@hono/zod-validator"
import { drizzle } from "drizzle-orm/d1"
import { Hono } from "hono"
import { array, number, object, string } from "zod"
import { optionsTable, postsTable, votesTable } from "~/schema"
import { and, eq } from "drizzle-orm"
import { cors } from "hono/cors"
import type { Env } from "~/worker-configuration"
import { HTTPException } from "hono/http-exception"

export const app = new Hono<{ Bindings: Env }>()

  .use(cors())

  .get("/", (c) => {
    return c.text("Hello Hono!")
  })

  /**
   * 投票箱を作成する
   */
  .post(
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
      console.log("A", postId)

      if (typeof json.deadline !== "number") {
        return c.json(
          {
            message: "deadline must be number",
            postId,
          },
          400,
        )
      }

      const a = await db.insert(postsTable).values({
        id: postId,
        name: json.name,
        deadline: new Date(json.deadline * 1000),
      })
      console.log("A1", a)

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

  /**
   * 投票箱を取得する
   */
  .get("/posts/:post", async (c) => {
    const postId = c.req.param("post")
    console.log("B-postId", postId)
    const db = drizzle(c.env.DB)
    console.log(
      "B1---------",
      await db.select().from(postsTable).where(eq(postsTable.id, postId)),
    )
    const post = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .get()
    console.log("B2")

    if (post === undefined) {
      return c.json(
        {
          message: "post not found",
          postId,
        },
        404,
      )
    }
    console.log("C", post)

    const allOptions = await db
      .select()
      .from(optionsTable)
      .where(eq(optionsTable.postId, post.id))
      .all()
    console.log("C1", allOptions)

    const allVotes = await db
      .select()
      .from(votesTable)
      .where(eq(votesTable.postId, post.id))
      .all()
    console.log("C2", allVotes)
    const options = allOptions.map((option) => {
      const votes = allVotes.filter((vote) => vote.optionId === option.id)
      return { ...option, count: votes.length }
    })
    console.log("D", options)
    return c.json({ ...post, options })
  })

  /**
   * 投票する
   */
  .post(
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

      const post = await db
        .select()
        .from(postsTable)
        .where(eq(postsTable.id, postId))
        .get()

      if (post === undefined) {
        throw new HTTPException(404, { message: "post not found" })
      }

      if (post.isClosed) {
        throw new HTTPException(400, { message: "post is closed" })
      }

      if (post.deadline < new Date()) {
        throw new HTTPException(400, { message: "post is closed" })
      }

      if (post.isDeleted) {
        throw new HTTPException(400, { message: "post is deleted" })
      }

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

      if (option === undefined) {
        return c.json(
          {
            message: "post not found",
            id: null,
          },
          404,
        )
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
        await db
          .update(votesTable)
          .set({
            id: voteId,
            postId: postId,
            userId: 0,
            idempotencyKey: json.idempotencyKey,
            optionId: option.id,
          })
          .where(eq(votesTable.id, existingVote.id))

        return c.json({
          message: null,
          id: voteId,
        })
      }

      await db.insert(votesTable).values({
        id: voteId,
        postId: postId,
        userId: 0,
        idempotencyKey: json.idempotencyKey,
        optionId: option.id,
      })

      return c.json({
        message: null,
        id: voteId,
      })
    },
  )

  /**
   * 投票箱を終了する
   */
  .put("/posts/:post/close", async (c) => {
    const postId = c.req.param("post")

    const db = drizzle(c.env.DB)

    const post = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .get()

    if (post === undefined) {
      return c.json(
        {
          message: "post not found",
          postId,
        },
        404,
      )
    }

    await db
      .update(postsTable)
      .set({ isClosed: true })
      .where(eq(postsTable.id, postId))

    return c.json({
      message: null,
      id: postId,
    })
  })

  /**
   * 投票箱を削除する
   */
  .delete(
    "/posts/:post",
    zValidator(
      "json",
      object({
        postId: string(),
      }),
    ),
    async (c) => {
      const postId = c.req.param("post")

      const db = drizzle(c.env.DB)

      const post = await db
        .select()
        .from(postsTable)
        .where(eq(postsTable.id, postId))
        .get()

      if (post === undefined) {
        return c.json(
          {
            message: "post not found",
            postId,
          },
          404,
        )
      }

      await db.delete(postsTable).where(eq(postsTable.id, postId)).returning()

      return c.json({})
    },
  )
  .onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ message: err.message }, err.status)
    }
    return c.json({ message: err.message }, 500)
  })
