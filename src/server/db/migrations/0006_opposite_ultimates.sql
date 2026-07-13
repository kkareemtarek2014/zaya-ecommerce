CREATE TABLE `product_views` (
	`product_id` text PRIMARY KEY NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `promo_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`promo_code` text NOT NULL,
	`order_id` text NOT NULL,
	`user_id` text,
	`discount` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`promo_code`) REFERENCES `promos`(`code`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `promos` ADD `max_redemptions` integer;
--> statement-breakpoint
INSERT INTO `promo_redemptions` (`id`, `promo_code`, `order_id`, `user_id`, `discount`, `created_at`)
SELECT
  'pr_' || lower(hex(randomblob(6))),
  o.`promo_code`,
  o.`id`,
  o.`user_id`,
  o.`discount`,
  o.`created_at`
FROM `orders` o
WHERE o.`promo_code` IS NOT NULL
  AND o.`promo_code` != ''
  AND EXISTS (SELECT 1 FROM `promos` p WHERE p.`code` = o.`promo_code`)
  AND NOT EXISTS (
    SELECT 1 FROM `promo_redemptions` r WHERE r.`order_id` = o.`id`
  );
