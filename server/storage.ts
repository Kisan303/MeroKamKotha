import { users, posts, comments, likes } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
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

// Setting up session store using PostgreSQL
const PostgresSessionStore = connectPg(session);

// Defining the IStorage interface which outlines methods for interacting with the database
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

  sessionStore: session.Store; // Session store for storing session data
}

// Main class for implementing the methods defined in IStorage interface
export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store; // Store for sessions using PostgreSQL

  constructor() {
    // Initialize session store with PostgreSQL configuration
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true, // Automatically create the session table if it doesn't exist
    });
  }

  // Fetch a user by their ID
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Fetch a user by their username
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  // Create a new user in the database
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Create a new post by a user
  async createPost(userId: number, post: InsertPost): Promise<Post> {
    // Insert post and associate it with the user
    const [newPost] = await db
      .insert(posts)
      .values({ ...post, userId, images: post.images || null }) // Ensure images field is not undefined
      .returning();
    return newPost;
  }

  // Fetch a post by its ID
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  // Fetch all posts from the database
  async getPosts(): Promise<Post[]> {
    return await db.select().from(posts);
  }

  // Update a specific post
  async updatePost(id: number, updates: Partial<InsertPost>): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set(updates)
      .where(eq(posts.id, id))
      .returning(); // Return the updated post
    return post;
  }

  // Delete a post by its ID
  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  // Create a new comment associated with a post
  async createComment(
    userId: number,
    comment: InsertComment,
  ): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values({ ...comment, userId }) // Associate the comment with the user
      .returning(); // Return the created comment
    return newComment;
  }

  // Fetch all comments associated with a specific post
  async getComments(postId: number): Promise<Comment[]> {
    // Return comments sorted by creation date, oldest first
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt, "asc"); // Sort comments in ascending order by creation date
  }

  // Toggle a like on a post (like or unlike)
  async toggleLike(userId: number, postId: number): Promise<boolean> {
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(eq(likes.userId, userId))
      .where(eq(likes.postId, postId)); // Check if the user already liked the post

    // If a like exists, delete it (unlike the post)
    if (existingLike) {
      await db.delete(likes).where(eq(likes.id, existingLike.id));
      return false; // Return false to indicate that the like was removed
    }

    // If no like exists, insert a new like
    await db.insert(likes).values({ userId, postId });
    return true; // Return true to indicate that the like was added
  }

  // Fetch all likes for a specific post
  async getLikes(postId: number): Promise<Like[]> {
    return await db.select().from(likes).where(eq(likes.postId, postId));
  }
}

// Export an instance of the DatabaseStorage class
export const storage = new DatabaseStorage();
