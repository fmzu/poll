import { WorkerEntrypoint } from "cloudflare:workers"
import type { Env } from "~/worker-configuration"
import { app } from "~/interface/api"

export default class extends WorkerEntrypoint<Env> {
  async fetch(request: Request) {
    return app.fetch(request, this.env)
  }

  async createPost(props: {
    title: string
    deadline: number
    options: string[]
  }) {
    const resp = await app.request("/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: props.title,
        deadline: props.deadline,
        options: props.options.map((value) => {
          return {
            name: value,
            value: value,
          }
        }),
      }),
    })

    const json = await resp.json()

    return json as {
      id: string
    }
  }

  async readPost(props: { postId: string }) {
    const resp = await app.request(`/posts/${props.postId}`, {
      method: "GET",
    })

    const json = await resp.json()

    return json as {
      name: string
      deadline: string
      id: string
      createdAt: string
      isDeleted: boolean
      isClosed: boolean
      options: {
        count: number
        value: string
        name: string
        id: string
        postId: string
      }[]
    }
  }

  async closePost(props: { postId: string }) {
    const resp = await app.request(`/posts/${props.postId}/close`, {
      method: "PUT",
    })

    const json = await resp.json()

    return json as {
      message: null
      id: string
    }
  }

  async createVote(props: {
    postId: string
    idempotencyKey: string
    optionValue: string
  }) {
    const resp = await app.request(`/posts/${props.postId}/votes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotencyKey: props.idempotencyKey,
        optionValue: props.optionValue,
      }),
    })

    const json = await resp.json()

    return json as {
      message: null
      id: string
    }
  }
}
