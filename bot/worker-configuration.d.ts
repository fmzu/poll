import type Api from "../api"

export type Env = {
  API: Service<Api>
  DISCORD_PUBLIC_KEY: string
}
