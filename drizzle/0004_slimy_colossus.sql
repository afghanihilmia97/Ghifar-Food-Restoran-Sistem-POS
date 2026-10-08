CREATE TABLE `oauth_challenges` (
	`nonce` text PRIMARY KEY NOT NULL,
	`expires` integer NOT NULL
);
