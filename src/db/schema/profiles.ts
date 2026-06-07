import { mysqlTable, varchar, timestamp, int, serial, double, bigint, text } from "drizzle-orm/mysql-core";
import { users } from "./users";

export const healthProfiles = mysqlTable("health_profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade" }),
  age: int("age").notNull(),
  gender: varchar("gender", { length: 50 }).notNull(), // male, female, other
  heightCm: double("height_cm").notNull(),
  weightKg: double("weight_kg").notNull(),
  activityLevel: varchar("activity_level", { length: 50 }).notNull(), // sedentary, light, moderate, active, very_active
  targetGoal: varchar("target_goal", { length: 50 }).notNull(), // weight_loss, maintenance, weight_gain
  calorieTarget: int("calorie_target").notNull(),
  proteinTarget: int("protein_target").notNull(),
  carbsTarget: int("carbs_target").notNull(),
  fatTarget: int("fat_target").notNull(),
  aiTipsCached: text("ai_tips_cached"),
  aiTipsHash: varchar("ai_tips_hash", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
