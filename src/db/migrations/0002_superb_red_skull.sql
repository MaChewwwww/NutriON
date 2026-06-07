CREATE TABLE `health_profiles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`age` int NOT NULL,
	`gender` varchar(50) NOT NULL,
	`height_cm` double NOT NULL,
	`weight_kg` double NOT NULL,
	`activity_level` varchar(50) NOT NULL,
	`target_goal` varchar(50) NOT NULL,
	`calorie_target` int NOT NULL,
	`protein_target` int NOT NULL,
	`carbs_target` int NOT NULL,
	`fat_target` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `foods` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`calories_per_serving` int NOT NULL,
	`protein_g` double NOT NULL DEFAULT 0,
	`carbs_g` double NOT NULL DEFAULT 0,
	`fat_g` double NOT NULL DEFAULT 0,
	`serving_size` double NOT NULL,
	`serving_unit` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `foods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_log_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`meal_log_id` int NOT NULL,
	`food_id` int,
	`custom_food_name` varchar(255),
	`quantity` double NOT NULL,
	`calories` int NOT NULL,
	`protein` double NOT NULL DEFAULT 0,
	`carbs` double NOT NULL DEFAULT 0,
	`fat` double NOT NULL DEFAULT 0,
	`serving_size` double NOT NULL,
	`serving_unit` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meal_log_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`category` varchar(50) NOT NULL,
	`notes` varchar(1000),
	`logged_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meal_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nutrition_lessons` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` varchar(1000) NOT NULL,
	`content` text NOT NULL,
	`reading_time_minutes` int NOT NULL,
	`published` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nutrition_lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminder_settings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`breakfast_enabled` boolean NOT NULL DEFAULT true,
	`breakfast_time` varchar(5) NOT NULL DEFAULT '08:00',
	`lunch_enabled` boolean NOT NULL DEFAULT true,
	`lunch_time` varchar(5) NOT NULL DEFAULT '13:00',
	`dinner_enabled` boolean NOT NULL DEFAULT true,
	`dinner_time` varchar(5) NOT NULL DEFAULT '19:00',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminder_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `health_profiles` ADD CONSTRAINT `health_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_log_items` ADD CONSTRAINT `meal_log_items_meal_log_id_meal_logs_id_fk` FOREIGN KEY (`meal_log_id`) REFERENCES `meal_logs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_log_items` ADD CONSTRAINT `meal_log_items_food_id_foods_id_fk` FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_logs` ADD CONSTRAINT `meal_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reminder_settings` ADD CONSTRAINT `reminder_settings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;