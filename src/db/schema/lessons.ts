import { mysqlTable, varchar, timestamp, int, serial, text, boolean } from "drizzle-orm/mysql-core";

export const nutritionLessons = mysqlTable("nutrition_lessons", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 1000 }).notNull(),
  content: text("content").notNull(), // markdown rich text article
  readingTimeMinutes: int("reading_time_minutes").notNull(),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
