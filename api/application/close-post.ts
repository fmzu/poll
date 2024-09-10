import type { Env } from "~/worker-configuration"
import { drizzle } from "drizzle-orm/d1"
import { postsTable } from "~/schema"
import { eq } from "drizzle-orm"
import { HTTPException } from "hono/http-exception"

type Props = {
  postId: string
}

class closePost {
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
        //   postId,
      })
    }

    await db
      .update(postsTable)
      .set({ isClosed: true })
      .where(eq(postsTable.id, props.postId))

    return {
      message: null,
      id: props.postId,
    }
  }
}
