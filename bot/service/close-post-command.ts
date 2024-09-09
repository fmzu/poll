import {
  type APIInteractionResponseChannelMessageWithSource,
  ApplicationCommandType,
  InteractionResponseType,
  type APIApplicationCommandInteraction,
} from "discord-api-types/v10"
import { HTTPException } from "hono/http-exception"
import { postIdMap } from "../utils/post-id-map"
import { DeadlineMap } from "../utils/deadline-map"
import { adminUserIdMap } from "../utils/admin-user-id-map"
import { errors } from "../utils/errors"
import type { Env } from "~/worker-configuration"

export async function handleClosePostCommand(
  interaction: APIApplicationCommandInteraction,
  env: Env,
) {
  const payload = interaction.data

  if (payload.type !== ApplicationCommandType.ChatInput) {
    throw new HTTPException(500)
  }

  if (payload.name !== "finish") {
    throw new HTTPException(500)
  }

  const titleObject = payload.options?.find((item) => item.name === "title")

  const titleValue =
    titleObject && "value" in titleObject ? titleObject.value : null

  const postId = postIdMap.get(interaction.channel.id)

  const post = await env.API.readPost({ postId: postId })

  await env.API.closePost({ postId: postId })

  // TODO: D1で書き直す！
  const adminUserId = adminUserIdMap.get(interaction.channel.id)

  if (adminUserId !== interaction.member?.user.id) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: errors.noPermission,
      },
    }
  }

  if (titleValue !== post.name) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: errors.postNotFound,
      },
    }
  }

  if (post === undefined) {
    // throw new HTTPException(500, { message: "Post not found" })
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: errors.postNotFound,
      },
    }
  }

  if (post.isClosed === true) {
    // throw new HTTPException(500, { message: "Post is closed" })
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: errors.postIsClosed,
      },
    }
  }

  if (post.isDeleted === true) {
    // throw new HTTPException(500, { message: "Post is deleted" })
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: errors.postNotFound,
      },
    }
  }

  const deadline = DeadlineMap.get(interaction.channel.id)

  let closeVoteResults = `「${post.name}」の投票を終了しました。\n期日: ${deadline}\n`
  for (let index = 0; index < post.options.length; index++)
    closeVoteResults += `${index + 1}.${post.options[index].name} (${post.options[index].count}票)\n`

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: closeVoteResults,
    },
  } satisfies APIInteractionResponseChannelMessageWithSource
}
