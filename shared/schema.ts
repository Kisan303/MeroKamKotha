import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  fullname: text("fullname").notNull(),
  password: text("password").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  verificationCode: text("verification_code"),
  verificationExpiry: timestamp("verification_expiry"),
});

// Update insert schema to include phone number
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isPhoneVerified: true,
  verificationCode: true,
  verificationExpiry: true,
}).extend({
  phoneNumber: z.string()
    .min(10, "Phone number is required")
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format. Must be E.164 format"),
});

// Schema for OTP verification
export const verifyOtpSchema = z.object({
  phoneNumber: z.string(),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
});

export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

// Add userBlocks table for blocking functionality
export const userBlocks = pgTable("user_blocks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  blockedUserId: integer("blocked_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Keep existing tables
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type", { enum: ["room", "job"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price"),
  location: text("location").notNull(),
  images: text("images").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema for creating new chats
export const insertChatSchema = z.object({
  participantIds: z.array(z.number()).min(2, "At least two participants required"),
});

// Schema for sending messages
export const insertMessageSchema = z.object({
  chatId: z.number(),
  content: z.string().min(1, "Message cannot be empty"),
});

// Keep existing schemas
export const insertPostSchema = z.object({
  type: z.enum(["room", "job"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  price: z.number().nullable(),
  images: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.type === "room") {
    return data.price !== null && data.price > 0;
  }
  return true;
}, {
  message: "Price is required for room posts and must be greater than 0",
  path: ["price"],
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  userId: true,
  createdAt: true,
  editedAt: true
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type UserBlock = typeof userBlocks.$inferSelect;
export type VerifyOtp = z.infer<typeof verifyOtpSchema>;