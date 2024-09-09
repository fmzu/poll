import { app } from "./interface/api"
import type { Env } from "./worker-configuration"

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    console.log("hello")
  },
} satisfies ExportedHandler<Env>
