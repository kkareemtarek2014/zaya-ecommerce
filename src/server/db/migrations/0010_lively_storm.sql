CREATE TABLE `bundle_items` (
	`bundle_id` text NOT NULL,
	`product_id` text NOT NULL,
	`qty` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`bundle_id`, `product_id`),
	FOREIGN KEY (`bundle_id`) REFERENCES `bundles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bundles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`config` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`starts_at` integer,
	`ends_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `products` ADD `preorder_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `preorder_eta_days` integer;