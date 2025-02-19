import { users, posts, comments, likes } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import {
  type User,
  type Post,
  type Comment,
  type Like,
  type InsertUser,
  type InsertPost,
  type InsertComment,
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createPost(userId: number, post: InsertPost): Promise<Post>;
  getPost(id: number): Promise<Post | undefined>;
  getPosts(): Promise<Post[]>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: number): Promise<void>;

  createComment(userId: number, comment: InsertComment): Promise<Comment>;
  getComments(postId: number): Promise<Comment[]>;

  toggleLike(userId: number, postId: number): Promise<boolean>;
  getLikes(postId: number): Promise<Like[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createPost(userId: number, post: InsertPost): Promise<Post> {
    const [newPost] = await db
      .insert(posts)
      .values({ ...post, userId, images: post.images || null })
      .returning();
    return newPost;
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getPosts(): Promise<Post[]> {
    return await db.select().from(posts);
  }

  async updatePost(id: number, updates: Partial<InsertPost>): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set(updates)
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async createComment(
    userId: number,
    comment: InsertComment,
  ): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values({ ...comment, userId })
      .returning();
    return newComment;
  }

  async getComments(postId: number): Promise<Comment[]> {
    console.log(`[Storage] Getting comments for post ${postId}`);
    try {
      const result = await db
        .select()
        .from(comments)
        .where(eq(comments.postId, postId))
        .orderBy(sql`${comments.createdAt} ASC`);

      console.log(`[Storage] Successfully retrieved ${result.length} comments:`, result);
      return result;
    } catch (error) {
      console.error(`[Storage] Error getting comments for post ${postId}:`, error);
      throw error;
    }
  }

  async toggleLike(userId: number, postId: number): Promise<boolean> {
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(eq(likes.userId, userId))
      .where(eq(likes.postId, postId));

    if (existingLike) {
      await db.delete(likes).where(eq(likes.id, existingLike.id));
      return false;
    }

    await db.insert(likes).values({ userId, postId });
    return true;
  }

  async getLikes(postId: number): Promise<Like[]> {
    return await db.select().from(likes).where(eq(likes.postId, postId));
  }
}

export const storage = new DatabaseStorage();