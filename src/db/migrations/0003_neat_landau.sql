ALTER TABLE `health_profiles` MODIFY COLUMN `user_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `meal_logs` MODIFY COLUMN `user_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `reminder_settings` MODIFY COLUMN `user_id` bigint unsigned NOT NULL;