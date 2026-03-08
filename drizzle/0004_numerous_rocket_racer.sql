ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('teacher','assistant') NOT NULL DEFAULT 'assistant';--> statement-breakpoint
ALTER TABLE `studyGroups` ADD `grade` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `openId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `loginMethod`;