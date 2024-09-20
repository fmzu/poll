import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const postsTable = sqliteTable("posts", {
  id: text("uuid", { length: 256 }).notNull().unique(),
  name: text("name", { length: 256 }).notNull(),
  deadline: integer("deadline", { mode: "timestamp" }).notNull(),
  ownerKey: text("owner_key", { length: 256 }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  isDeleted: integer("is_deleted", { mode: "boolean" })
    .notNull()
    .default(false),
  isClosed: integer("is_closed", { mode: "boolean" }).notNull().default(false),
})

export const postRelations = relations(postsTable, (fn) => {
  return {
    options: fn.many(optionsTable),
    votes: fn.many(votesTable),
  }
})

export const optionsTable = sqliteTable("options", {
  id: text("uuid", { length: 256 }).notNull().unique(),
  name: text("name", { length: 256 }).notNull(),
  value: text("value", { length: 256 }).notNull(),
  postId: text("post_id").notNull(),
})

export const optionRelations = relations(optionsTable, (fn) => {
  return {
    post: fn.one(postsTable, {
      fields: [optionsTable.postId],
      references: [postsTable.id],
    }),
  }
})

export const votesTable = sqliteTable("votes", {
  id: text("uuid", { length: 256 }).notNull().unique(),
  postId: text("post_id").notNull(),
  userId: integer("user_id").notNull(),
  idempotencyKey: text("idempotency_key", { length: 256 }).notNull(),
  optionId: text("option_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

export const voteRelations = relations(votesTable, (fn) => {
  return {
    posts: fn.many(postsTable),
  }
})
