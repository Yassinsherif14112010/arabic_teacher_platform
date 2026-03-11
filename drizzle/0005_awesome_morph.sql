CREATE TABLE `feeSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`academicYear` varchar(9) NOT NULL,
	`grade` varchar(100) NOT NULL,
	`feeAmount` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feeSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `students` ADD `feePaid` boolean DEFAULT false;