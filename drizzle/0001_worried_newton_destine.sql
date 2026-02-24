CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`attendanceDate` date NOT NULL,
	`status` enum('present','absent','late') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`examType` enum('daily','monthly','final') NOT NULL,
	`score` decimal(5,2) NOT NULL,
	`maxScore` decimal(5,2) DEFAULT '100',
	`examDate` date NOT NULL,
	`subject` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `grades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthlyFees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`feeAmount` decimal(10,2) NOT NULL,
	`paid` boolean DEFAULT false,
	`paidDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monthlyFees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentDate` date NOT NULL,
	`paymentMethod` enum('cash','transfer','check') NOT NULL,
	`month` varchar(7),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20),
	`parentPhone` varchar(20),
	`barcodeNumber` varchar(50) NOT NULL,
	`groupId` int,
	`registrationDate` timestamp NOT NULL DEFAULT (now()),
	`status` enum('active','inactive','graduated') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_barcodeNumber_unique` UNIQUE(`barcodeNumber`)
);
--> statement-breakpoint
CREATE TABLE `studyGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`schedule` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studyGroups_id` PRIMARY KEY(`id`)
);
