import type { Env } from "~/worker-configuration"
import { drizzle } from "drizzle-orm/d1"
import { optionsTable, postsTable } from "~/schema"
import { HTTPException } from "hono/http-exception"

type Props = {
  name: string
  deadline: number
  options: {
    name: string
    value: string
  }[]
}

export default class CreatePost {
  constructor(readonly env: Env) {}

  async execute(props: Props) {
    const db = drizzle(this.env.DB)

    const postId = crypto.randomUUID()

    if (props.name === undefined) {
      return new HTTPException(400, {
        message: "nameは必須です",
        // postId,
      })
    }

    if (props.deadline === undefined) {
      return new HTTPException(400, {
        message: "deadlineは必須です",
        //   postId,
      })
    }

    if (typeof props.deadline !== "number") {
      return new HTTPException(400, {
        message: "deadlineは数字である必要があります",
        // postId,
      })
    }

    if (props.options === undefined) {
      return new HTTPException(400, {
        message: "optionsは必須です",
        //   postId,
      })
    }

    await db.insert(postsTable).values({
      id: postId,
      name: props.name,
      deadline: new Date(props.deadline * 1000),
    })

    for (const option of props.options) {
      await db.insert(optionsTable).values({
        id: crypto.randomUUID(),
        name: option.name,
        value: option.value,
        postId: postId,
      })
    }

    return { id: postId }
  }
}
