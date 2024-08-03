import type { Serve } from "bun"

const app: Serve = {
  fetch(req) {
    return new Response("Hello, World!")
  },
}

export default app satisfies Serve
