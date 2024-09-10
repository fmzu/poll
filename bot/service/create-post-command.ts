import {
  type APIActionRowComponent,
  type APIApplicationCommandInteraction,
  type APIInteractionResponseChannelMessageWithSource,
  type APIStringSelectComponent,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ComponentType,
  InteractionResponseType,
} from "discord-api-types/v10"
import { HTTPException } from "hono/http-exception"
import { formatDeadline } from "../utils/format-vote-deadline"
import { postIdMap } from "../utils/post-id-map"
import { calcDeadline } from "../utils/calc-deadline"
import { DeadlineMap } from "../utils/deadline-map"
import { adminUserIdMap } from "../utils/admin-user-id-map"
import { errors } from "../utils/errors"
import type { Env } from "~/worker-configuration"

export async function handleCreatePostCommand(
  interaction: APIApplicationCommandInteraction,
  env: Env,
) {
  const payload = interaction.data

  if (payload.type !== ApplicationCommandType.ChatInput) {
    throw new HTTPException(500)
  }

  if (payload.name !== "vote") {
    throw new HTTPException(500)
  }

  const adminUserId = interaction.member?.user.id

  adminUserIdMap.set(interaction.channel.id, adminUserId)

  const interactionOptions = payload.options ?? []

  const [optionA, optionB, optionC] = interactionOptions

  if (optionA.type !== ApplicationCommandOptionType.String) {
    throw new HTTPException(500, { message: "Invalid option type" })
  }

  if (optionB.type !== ApplicationCommandOptionType.String) {
    throw new HTTPException(500, { message: "Invalid option type" })
  }

  if (optionC.type !== ApplicationCommandOptionType.String) {
    throw new HTTPException(500, { message: "Invalid option type" })
  }

  // { name: 'title', type: 3, value: 'a' },
  const postTitle = optionA.value

  //  name: 'deadline', type: 3, value: '1' },
  const postDeadline = optionB.value

  // { name: 'options', type: 3, value: 'a' }
  const postOptions = optionC.value.split(" ")

  if (postOptions.length > 25) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: errors.tooManyOptions,
      },
    }
  }

  if (postOptions.some((option) => option.length > 30)) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: errors.optionTooLong,
      },
    }
  }

  /**
   * 投票が有効な日数
   */
  const activeDaysCount = Number(postDeadline)

  const deadline = calcDeadline(activeDaysCount)

  const formattedVoteDeadline = formatDeadline(deadline)

  DeadlineMap.set(interaction.channel.id, formattedVoteDeadline)

  const newPost = await env.API.createPost({
    title: postTitle,
    deadline: deadline,
    options: postOptions,
  })

  if (newPost instanceof HTTPException) {
    throw newPost
  }

  postIdMap.set(interaction.channel.id, newPost.id)

  const voteMessageText = `「${postTitle}」の投票箱が設置されました。\n期日: ${formattedVoteDeadline}\n`

  const component: APIActionRowComponent<APIStringSelectComponent> = {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.StringSelect,
        custom_id: newPost.id,
        placeholder: "何か一つ選んでください",
        options: postOptions.map((option) => {
          return {
            label: option,
            value: option,
          }
        }),
      },
    ],
  }

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: voteMessageText,
      components: [component],
    },
  } satisfies APIInteractionResponseChannelMessageWithSource
}
