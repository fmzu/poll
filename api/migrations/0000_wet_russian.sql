CREATE TABLE `options` (
	`uuid` text(256) NOT NULL,
	`name` text(256) NOT NULL,
	`value` text(256) NOT NULL,
	`post_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`uuid` text(256) NOT NULL,
	`name` text(256) NOT NULL,
	`max_count` integer DEFAULT 1 NOT NULL,
	`deadline` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`uuid` text(256) NOT NULL,
	`post_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`idempotency_key` text(256) NOT NULL,
	`option_id` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `options_uuid_unique` ON `options` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `posts_uuid_unique` ON `posts` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `votes_uuid_unique` ON `votes` (`uuid`);