CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`hashedPassword` text NOT NULL,
	`token` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `todos` ADD `userId` integer;