import { hc } from "hono/client"
import type app from "../src"

const client = hc<typeof app>("http://127.0.0.1:8787")

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

console.log(post)
