import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  fullname: text("fullname").notNull(),
  password: text("password").notNull(),
});

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

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertPostSchema = createInsertSchema(posts)
  .omit({ 
    id: true,
    userId: true,
    createdAt: true,
    editedAt: true
  })
  .extend({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    location: z.string().min(1, "Location is required"),
    type: z.enum(["room", "job"]),
    price: z.number().nullable(),
    images: z.array(z.string().url("Invalid image URL")).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "room") {
        return (data.images && data.images.length > 0 && data.price !== null);
      }
      return true;
    },
    {
      message: "For room posts, images and price are required",
      path: ["images"],
    }
  );
export const insertCommentSchema = createInsertSchema(comments).omit({ 
  id: true,
  userId: true,
  createdAt: true,
  editedAt: true
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;