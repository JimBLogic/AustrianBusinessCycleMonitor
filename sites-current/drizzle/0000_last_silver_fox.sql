CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `files_owner_idx` ON `files` (`owner_email`);--> statement-breakpoint
CREATE TABLE `finance_items` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`symbol` text NOT NULL,
	`label` text NOT NULL,
	`category` text NOT NULL,
	`units` real,
	`cost_basis` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `finance_items_owner_idx` ON `finance_items` (`owner_email`);--> statement-breakpoint
CREATE TABLE `macro_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`requested_at` text NOT NULL,
	`refresh_mode` text NOT NULL,
	`regime` text NOT NULL,
	`scores_json` text NOT NULL,
	`metrics_json` text NOT NULL,
	`provenance_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `macro_snapshots_requested_at_idx` ON `macro_snapshots` (`requested_at`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`title` text NOT NULL,
	`thesis` text NOT NULL,
	`counter_thesis` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reviews_owner_idx` ON `reviews` (`owner_email`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`due_date` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tasks_owner_status_idx` ON `tasks` (`owner_email`,`status`);--> statement-breakpoint
CREATE TABLE `users` (
	`email` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
