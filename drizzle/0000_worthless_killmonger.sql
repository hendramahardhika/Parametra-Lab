CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`uid` text NOT NULL,
	`kind` text NOT NULL,
	`module` integer NOT NULL,
	`payload` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_activities_uid_created` ON `activities` (`uid`,`created`);--> statement-breakpoint
CREATE TABLE `learners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`class_name` text DEFAULT 'XI Teknik Pemesinan' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`uid` text NOT NULL,
	`module` integer NOT NULL,
	`filename` text NOT NULL,
	`object_key` text,
	`drive_url` text DEFAULT '' NOT NULL,
	`fusion_url` text DEFAULT '' NOT NULL,
	`reflection` text NOT NULL,
	`cycle` text NOT NULL,
	`created` text NOT NULL,
	`score` integer,
	`feedback` text,
	`reviewer` text
);
--> statement-breakpoint
CREATE INDEX `idx_submissions_uid_created` ON `submissions` (`uid`,`created`);