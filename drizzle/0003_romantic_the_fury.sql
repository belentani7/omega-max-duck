CREATE TABLE `communications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`recipientUserId` int,
	`audience` varchar(24) NOT NULL,
	`channel` varchar(24) NOT NULL DEFAULT 'in_app',
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `communications` ADD CONSTRAINT `communications_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communications` ADD CONSTRAINT `communications_recipientUserId_users_id_fk` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `communications_recipient_idx` ON `communications` (`recipientUserId`);--> statement-breakpoint
CREATE INDEX `communications_project_idx` ON `communications` (`projectId`);