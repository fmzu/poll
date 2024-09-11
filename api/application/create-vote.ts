import type { Env } from "~/worker-configuration"
import { drizzle } from "drizzle-orm/d1"
import { optionsTable, postsTable, votesTable } from "~/schema"
import { and, eq } from "drizzle-orm"
import { HTTPException } from "hono/http-exception"

type Props = {
  postId: string
  json: {
    optionValue: string
    idempotencyKey: string
  }
}

export default class createVote {
  constructor(readonly env: Env) {}

  async execute(props: Props) {
    const db = drizzle(this.env.DB)

    const post = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, props.postId))
      .get()

    if (post === undefined) {
      return new HTTPException(404, {
        message: "投票が見つかりません",
        //   boxId,
      })
    }

    if (post.isClosed) {
      return new HTTPException(400, {
        message: "投票は終了しています",
        //   id: null,
      })
    }

    if (post.deadline < new Date()) {
      return new HTTPException(400, {
        message: "投票は終了しています",
        //   id: null,
      })
    }

    if (post.isDeleted) {
      return new HTTPException(400, {
        message: "投票が見つかりません",
        // id: null,
      })
    }

    const voteId = crypto.randomUUID()

    const option = await db
      .select()
      .from(optionsTable)
      .where(
        and(
          eq(optionsTable.postId, props.postId),
          eq(optionsTable.value, props.json.optionValue),
        ),
      )
      .get()

    if (option === undefined) {
      return new HTTPException(404, {
        message: "投票が見つかりません",
        //   id: null,
      })
    }

    const existingVote = await db
      .select()
      .from(votesTable)
      .where(
        and(
          eq(votesTable.postId, props.postId),
          eq(votesTable.idempotencyKey, props.json.idempotencyKey),
        ),
      )
      .get()

    if (existingVote) {
      // 既存の投票を更新する
      await db
        .update(votesTable)
        .set({
          id: voteId,
          postId: props.postId,
          userId: 0,
          idempotencyKey: props.json.idempotencyKey,
          optionId: option.id,
        })
        .where(eq(votesTable.id, existingVote.id))

      return {
        message: null,
        id: voteId,
      }
    }

    await db.insert(votesTable).values({
      id: voteId,
      postId: props.postId,
      userId: 0,
      idempotencyKey: props.json.idempotencyKey,
      optionId: option.id,
    })

    return {
      message: null,
      id: voteId,
    }
  }
}
