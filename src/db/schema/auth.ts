import { mysqlTable, varchar, timestamp, int, serial } from "drizzle-orm/mysql-core";

export const emailOtps = mysqlTable("email_otps", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  userId: int("user_id"),
  purpose: varchar("purpose", { length: 50 }).notNull(),
  codeHash: varchar("code_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  attemptCount: int("attempt_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refreshTokens = mysqlTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
  familyId: varchar("family_id", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  replacedByTokenId: int("replaced_by_token_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
