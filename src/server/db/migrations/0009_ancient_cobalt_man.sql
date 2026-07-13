ALTER TABLE `products` ADD `source_provider` text;--> statement-breakpoint
ALTER TABLE `products` ADD `source_url` text;--> statement-breakpoint
ALTER TABLE `products` ADD `source_product_id` text;--> statement-breakpoint
ALTER TABLE `products` ADD `source_variant_map` text;--> statement-breakpoint
ALTER TABLE `products` ADD `source_in_stock` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `last_synced_at` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `fulfilment_type` text DEFAULT 'local_stock' NOT NULL;