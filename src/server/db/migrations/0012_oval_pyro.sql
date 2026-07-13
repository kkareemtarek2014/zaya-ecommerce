CREATE TABLE `shipments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`provider` text DEFAULT 'bosta' NOT NULL,
	`bosta_delivery_id` text,
	`tracking_number` text,
	`bosta_state` text,
	`last_event_id` text,
	`mapped_status` text,
	`cod_amount` integer DEFAULT 0 NOT NULL,
	`raw` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shipments_tracking_number_unique` ON `shipments` (`tracking_number`);--> statement-breakpoint
ALTER TABLE `governorates` ADD `bosta_city_id` text;--> statement-breakpoint
ALTER TABLE `governorates` ADD `bosta_zone` text;--> statement-breakpoint
ALTER TABLE `governorates` ADD `bosta_district` text;