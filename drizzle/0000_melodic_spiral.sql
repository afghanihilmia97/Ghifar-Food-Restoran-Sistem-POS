CREATE TABLE `members` (
	`workspace` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`workspace`, `email`)
);
--> statement-breakpoint
CREATE TABLE `online_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`payload` text NOT NULL,
	`created` text NOT NULL,
	`claimed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL
);
