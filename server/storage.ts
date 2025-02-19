import { User, Post, Comment, Like, InsertUser, InsertPost, InsertComment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  private currentId: number;
  readonly sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPost(userId: number, post: InsertPost): Promise<Post> {
    const id = this.currentId++;
    const newPost: Post = {
      ...post,
      id,
      userId,
      createdAt: new Date(),
    };
    this.posts.set(id, newPost);
    return newPost;
  }

  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getPosts(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }

  async updatePost(id: number, updates: Partial<InsertPost>): Promise<Post> {
    const post = await this.getPost(id);
    if (!post) throw new Error("Post not found");
    
    const updatedPost = { ...post, ...updates };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async deletePost(id: number): Promise<void> {
    this.posts.delete(id);
  }

  async createComment(userId: number, comment: InsertComment): Promise<Comment> {
    const id = this.currentId++;
    const newComment: Comment = {
      ...comment,
      id,
      userId,
      createdAt: new Date(),
    };
    this.comments.set(id, newComment);
    return newComment;
  }

  async getComments(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.postId === postId,
    );
  }

  async toggleLike(userId: number, postId: number): Promise<boolean> {
    const existingLike = Array.from(this.likes.values()).find(
      (like) => like.userId === userId && like.postId === postId,
    );

    if (existingLike) {
      this.likes.delete(existingLike.id);
      return false;
    }

    const id = this.currentId++;
    this.likes.set(id, { id, userId, postId });
    return true;
  }

  async getLikes(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(
      (like) => like.postId === postId,
    );
  }
}

export const storage = new MemStorage();
