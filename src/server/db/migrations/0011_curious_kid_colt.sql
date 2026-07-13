CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`provider` text DEFAULT 'paymob' NOT NULL,
	`method` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'EGP' NOT NULL,
	`paymob_intention_id` text,
	`paymob_transaction_id` text,
	`client_secret` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`raw` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_paymob_transaction_id_unique` ON `payments` (`paymob_transaction_id`);