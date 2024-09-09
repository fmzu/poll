export class ApiClient {
  constructor(
    private fetcher: Fetcher,
    private baseURL = "https://vote.fmzu.workers.dev/",
  ) {}

  /**
   * 投票箱を作成する
   */
  async createPost(props: {
    title: string
    deadline: number
    options: string[]
  }) {
    const resp = await this.fetcher.fetch(`${this.baseURL}posts`, {
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

  /**
   * 投票箱の情報を取得する
   */
  async getPost(props: { postId: string }) {
    const resp = await this.fetcher.fetch(
      `${this.baseURL}posts/${props.postId}`,
      {
        method: "GET",
      },
    )

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

  /**
   * 投票する
   */
  async createVote(props: {
    postId: string
    idempotencyKey: string
    optionValue: string
  }) {
    const resp = await this.fetcher.fetch(
      `${this.baseURL}posts/${props.postId}/votes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotencyKey: props.idempotencyKey,
          optionValue: props.optionValue,
        }),
      },
    )

    const json = await resp.json()

    return json as {
      message: null
      id: string
    }
  }

  /**
   * 投票箱を終了する
   */
  async closePost(props: { postId: string }) {
    const resp = await this.fetcher.fetch(
      `${this.baseURL}posts/${props.postId}/close`,
      {
        method: "PUT",
      },
    )

    const json = await resp.json()

    return json as {
      message: null
      id: string
    }
  }

  /**
   * 投票箱を削除する
   */
  async deletePost(props: { postId: string }) {
    const resp = await this.fetcher.fetch(
      `${this.baseURL}posts/${props.postId}`,
      {
        method: "DELETE",
      },
    )

    const json = await resp.json()

    return json as unknown
  }
}
