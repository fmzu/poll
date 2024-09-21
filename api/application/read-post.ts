import type { Env } from "~/worker-configuration"
import { drizzle } from "drizzle-orm/d1"
import { optionsTable, postsTable, votesTable } from "~/schema"
import { eq } from "drizzle-orm"
import { HTTPException } from "hono/http-exception"

type Props = {
  postId: string
}

export default class ReadPost {
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

    return { ...post, options }
  }
}
