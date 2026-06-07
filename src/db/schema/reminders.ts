import { mysqlTable, varchar, timestamp, int, serial, boolean, bigint } from "drizzle-orm/mysql-core";
import { users } from "./users";

export const reminderSettings = mysqlTable("reminder_settings", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade" }),
  breakfastEnabled: boolean("breakfast_enabled").default(true).notNull(),
  breakfastTime: varchar("breakfast_time", { length: 5 }).default("08:00").notNull(), // HH:MM
  lunchEnabled: boolean("lunch_enabled").default(true).notNull(),
  lunchTime: varchar("lunch_time", { length: 5 }).default("13:00").notNull(),
  dinnerEnabled: boolean("dinner_enabled").default(true).notNull(),
  dinnerTime: varchar("dinner_time", { length: 5 }).default("19:00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
