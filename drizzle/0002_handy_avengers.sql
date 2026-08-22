CREATE TABLE `contact_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`email` varchar(320) NOT NULL,
	`service` varchar(120),
	`message` text NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `contact_requests_status_idx` ON `contact_requests` (`status`);--> statement-breakpoint
CREATE INDEX `contact_requests_created_idx` ON `contact_requests` (`createdAt`);