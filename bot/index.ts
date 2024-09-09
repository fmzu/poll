import { verifyKey } from "discord-interactions"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { ApiClient } from "./utils/api-client"
import { handleCreatePostCommand } from "./service/create-post-command"
import {
  type APIInteraction,
  type APIInteractionResponseChannelMessageWithSource,
  type APIInteractionResponsePong,
  ComponentType,
  InteractionResponseType,
  InteractionType,
} from "discord-api-types/v10"
import { handleCheckPostCommand } from "./service/check-post-command"
import { handleClosePostCommand } from "./service/close-post-command"
import { errors } from "./utils/errors"
import type { Env } from "./worker-configuration"

const app = new Hono<{ Bindings: Env }>()

app.post("/", async (c) => {
  /**
   * - ApplicationCommand
   * - MessageComponent
   */
  const interaction = await c.req.json<APIInteraction>()

  const signature = c.req.header("X-Signature-Ed25519")

  const timestamp = c.req.header("X-Signature-Timestamp")

  if (!signature || !timestamp) {
    return c.status(401)
  }

  const isValidRequest = await verifyKey(
    JSON.stringify(interaction),
    signature,
    timestamp,
    "4aa56a5ed0c773ac85a713a5f92728a9f9bcc25d311ecc446bace7214dc98890",
  )

  if (!isValidRequest) {
    throw new HTTPException(401)
  }

  const client = new ApiClient(c.env.API, c.req.url)

  if (interaction.type === InteractionType.Ping) {
    return c.json<APIInteractionResponsePong>({
      type: InteractionResponseType.Pong,
    })
  }

  if (interaction.type === InteractionType.ApplicationCommand) {
    /**
     * APIApplicationCommandInteraction
     */
    const payload = interaction.data

    if (payload.name === "vote") {
      const result = await handleCreatePostCommand(interaction, client)
      return c.json(result)
    }

    if (payload.name === "check") {
      const result = await handleCheckPostCommand(interaction, client)
      return c.json(result)
    }

    if (payload.name === "finish") {
      const result = await handleClosePostCommand(interaction, client)
      return c.json(result)
    }
  }

  if (interaction.type === InteractionType.MessageComponent) {
    /**
     * APIMessageComponentInteraction
     * data: { component_type: 3, custom_id: "starter", values: ["a"] },
     */
    const payload = interaction.data

    // 投票に対する選択
    if (interaction.message.interaction?.name === "vote") {
      if (payload.component_type !== ComponentType.StringSelect) {
        throw new HTTPException(500, { message: "Invalid component type" })
      }
      const postId = payload.custom_id

      const [optionValue] = payload.values

      const userId = interaction.message.interaction.user.id

      const apiClient = new ApiClient(c.env.API, c.req.url)

      // やること！！！！！: 投票を受け付けたメッセージを本人のみに表示する
      await apiClient.createVote({
        postId,
        idempotencyKey: userId,
        optionValue: optionValue,
      })

      const post = await apiClient.getPost({ postId: postId })

      if (post.isClosed === true) {
        return c.json<APIInteractionResponseChannelMessageWithSource>({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: errors.postIsClosed,
          },
        })
      }

      if (post.isDeleted === true) {
        return c.json<APIInteractionResponseChannelMessageWithSource>({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: errors.postNotFound,
          },
        })
      }

      const voteMessageText = `投票「${optionValue}」を受け付けました。`

      return c.json<APIInteractionResponseChannelMessageWithSource>({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: voteMessageText,
        },
      })
    }
  }

  return c.json({ type: 1 })
})

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    console.log("hello")
  },
} satisfies ExportedHandler<Env>
