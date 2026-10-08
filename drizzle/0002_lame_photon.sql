CREATE TABLE `backups` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`revision` integer NOT NULL,
	`object_key` text NOT NULL,
	`created` text NOT NULL,
	`actor` text NOT NULL,
	`reason` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `backups_workspace_revision` ON `backups` (`workspace`,`revision`);--> statement-breakpoint
CREATE TABLE `operations` (
	`workspace` text NOT NULL,
	`id` text NOT NULL,
	`actor` text NOT NULL,
	`type` text NOT NULL,
	`result` text NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`workspace`, `id`)
);
