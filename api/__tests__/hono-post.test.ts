import { test, expect } from "bun:test"
import { hc } from "hono/client"
import type app from "../src"

const client = hc<typeof app>("http://127.0.0.1:8787")

test("投票箱を作成する", async () => {
  const resp = await client.posts.$post({
    json: {
      name: "Hello Hono!",
      deadline: 1633728000000,
      options: [
        { name: "Option 1", value: "Value 1" },
        { name: "Option 2", value: "Value 2" },
      ],
    },
  })

  const post = await resp.json()

  expect(post.id).toBeString()
})

test("オプションが存在しない場合は投票できない", async () => {
  const resp = await client.posts.$post({
    json: {
      name: "Hello Hono!",
      deadline: new Date().getTime() / 1000 + 10000,
      options: [
        { name: "apple", value: "apple " },
        { name: "coffee", value: "coffee" },
      ],
    },
  })

  const post = await resp.json()

  // 投票する
  {
    const resp = await client.posts[":post"].votes.$post({
      param: { post: post.id },
      json: {
        idempotencyKey: "a",
        optionValue: "tea",
      },
    })

    expect(resp.status).toBe(404)

    const result = await resp.json()

    expect(result.message).toBeString()
  }
})

test("投票箱が終了している場合は投票できない", async () => {
  const resp = await client.posts.$post({
    json: {
      name: "Hello Hono!",
      deadline: 1633728000000,
      options: [
        { name: "apple", value: "apple" },
        { name: "coffee", value: "coffee" },
      ],
    },
  })

  const post = await resp.json()

  // 投票箱を終了する
  {
    const resp = await client.posts[":post"].close.$put({
      param: { post: post.id },
    })

    const result = await resp.json()

    expect(result.message).toBeNull()
  }

  // 投票する
  {
    const resp = await client.posts[":post"].votes.$post({
      param: { post: post.id },
      json: {
        idempotencyKey: "a",
        optionValue: "apple",
      },
    })

    expect(resp.status).toBe(400)

    const result = await resp.json()

    expect(result.message).toBeString()
  }
})
