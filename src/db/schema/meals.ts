import { mysqlTable, varchar, timestamp, int, serial, double, bigint } from "drizzle-orm/mysql-core";
import { users } from "./users";

export const foods = mysqlTable("foods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  caloriesPerServing: int("calories_per_serving").notNull(),
  proteinG: double("protein_g").default(0).notNull(),
  carbsG: double("carbs_g").default(0).notNull(),
  fatG: double("fat_g").default(0).notNull(),
  servingSize: double("serving_size").notNull(),
  servingUnit: varchar("serving_unit", { length: 50 }).notNull(), // g, piece, cup, pack
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealLogs = mysqlTable("meal_logs", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).notNull(), // breakfast, lunch, dinner, snack
  notes: varchar("notes", { length: 1000 }),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealLogItems = mysqlTable("meal_log_items", {
  id: serial("id").primaryKey(),
  mealLogId: bigint("meal_log_id", { mode: "number", unsigned: true }).notNull().references(() => mealLogs.id, { onDelete: "cascade" }),
  foodId: bigint("food_id", { mode: "number", unsigned: true }).references(() => foods.id, { onDelete: "set null" }),
  customFoodName: varchar("custom_food_name", { length: 255 }),
  quantity: double("quantity").notNull(), // multiplier of servingSize
  calories: int("calories").notNull(),
  protein: double("protein").default(0).notNull(),
  carbs: double("carbs").default(0).notNull(),
  fat: double("fat").default(0).notNull(),
  servingSize: double("serving_size").notNull(),
  servingUnit: varchar("serving_unit", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
