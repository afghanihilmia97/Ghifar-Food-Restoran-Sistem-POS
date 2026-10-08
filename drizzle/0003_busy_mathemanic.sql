CREATE TABLE `account_invites` (
	`token` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `account_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `account_sessions_user` ON `account_sessions` (`user`);--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text DEFAULT '' NOT NULL,
	`recovery` text DEFAULT '' NOT NULL,
	`google_sub` text,
	`workspace` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_email_unique` ON `accounts` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_google_sub_unique` ON `accounts` (`google_sub`);--> statement-breakpoint
CREATE TABLE `auth_rates` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspace_security` (
	`workspace` text PRIMARY KEY NOT NULL,
	`pin` text DEFAULT '' NOT NULL,
	`google_client_id` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspace_accounts` (
	`workspace` text NOT NULL,
	`user` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`workspace`, `user`)
);
