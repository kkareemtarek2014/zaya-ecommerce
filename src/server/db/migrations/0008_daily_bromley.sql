CREATE TABLE `fx_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`base` text DEFAULT 'USD' NOT NULL,
	`quote` text DEFAULT 'EGP' NOT NULL,
	`rate` real NOT NULL,
	`source` text NOT NULL,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `products` ADD `base_price_usd` real;--> statement-breakpoint
ALTER TABLE `products` ADD `landed_cost` integer;