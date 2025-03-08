import { users, posts, comments, bookmarks, chats, chatParticipants, messages, userBlocks } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import {
  type User,
  type Post,
  type Comment,
  type Bookmark,
  type InsertUser,
  type InsertPost,
  type InsertComment,
  type Chat,
  type Message,
  type ChatParticipant,
  type InsertChat,
  type InsertMessage,
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
  getComment(id: number): Promise<Comment | undefined>;
  getComments(postId: number): Promise<Comment[]>;
  updateComment(id: number, content: string): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
  toggleBookmark(userId: number, postId: number): Promise<boolean>;
  getBookmarks(userId: number): Promise<Bookmark[]>;
  isBookmarked(userId: number, postId: number): Promise<boolean>;
  getUserChats(userId: number): Promise<Chat[]>;
  getChatParticipants(chatId: number): Promise<User[]>;
  getLastMessage(chatId: number): Promise<{ content: string; createdAt: string } | undefined>;
  createChat(participantIds: number[]): Promise<Chat>;
  getChatMessages(chatId: number): Promise<Message[]>;
  createMessage(userId: number, message: InsertMessage): Promise<Message>;
  updateChatLastMessage(chatId: number): Promise<void>;
  sessionStore: session.Store;
  getUserPosts(userId: number): Promise<Post[]>;
  deleteChat(chatId: number): Promise<void>;
  blockUser(userId: number, blockedUserId: number): Promise<void>;
  unblockUser(userId: number, blockedUserId: number): Promise<void>;
  isUserBlocked(userId: number, blockedUserId: number): Promise<boolean>;
  getBlockedUsers(userId: number): Promise<User[]>;
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

  async createComment(userId: number, comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values({ ...comment, userId })
      .returning();
    return newComment;
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }

  async getComments(postId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(sql`${comments.createdAt} ASC`);
  }

  async updateComment(id: number, content: string): Promise<Comment> {
    const [comment] = await db
      .update(comments)
      .set({ content, editedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return comment;
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  async toggleBookmark(userId: number, postId: number): Promise<boolean> {
    const [existingBookmark] = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .where(eq(bookmarks.postId, postId));

    if (existingBookmark) {
      await db.delete(bookmarks).where(eq(bookmarks.id, existingBookmark.id));
      return false;
    }

    await db.insert(bookmarks).values({ userId, postId });
    return true;
  }

  async getBookmarks(userId: number): Promise<Bookmark[]> {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));
  }

  async isBookmarked(userId: number, postId: number): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .where(eq(bookmarks.postId, postId));
    return !!bookmark;
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    const results = await db
      .select()
      .from(chats)
      .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
      .where(eq(chatParticipants.userId, userId))
      .orderBy(sql`${chats.lastMessageAt} DESC`);

    return results.map(({ chats }) => chats);
  }

  async getChatParticipants(chatId: number): Promise<User[]> {
    const results = await db
      .select({
        user: users,
      })
      .from(chatParticipants)
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(eq(chatParticipants.chatId, chatId));

    return results.map(({ user }) => user);
  }

  async getLastMessage(chatId: number): Promise<{ content: string; createdAt: string } | undefined> {
    const [lastMessage] = await db
      .select({
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(sql`${messages.createdAt} DESC`)
      .limit(1);

    return lastMessage;
  }

  async createChat(participantIds: number[]): Promise<Chat> {
    // Create new chat
    const [chat] = await db.insert(chats).values({}).returning();
    console.log("Created chat:", chat);

    try {
      // Add participants
      await Promise.all(
        participantIds.map((userId) =>
          db.insert(chatParticipants).values({
            chatId: chat.id,
            userId,
          })
        )
      );
      console.log("Added participants:", participantIds, "to chat:", chat.id);

      return chat;
    } catch (error) {
      // If adding participants fails, delete the chat
      await db.delete(chats).where(eq(chats.id, chat.id));
      console.error("Error adding chat participants:", error);
      throw new Error("Failed to create chat with participants");
    }
  }

  async getChatMessages(chatId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(sql`${messages.createdAt} ASC`);
  }

  async createMessage(userId: number, message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        userId,
        chatId: message.chatId,
        content: message.content,
      })
      .returning();

    return newMessage;
  }

  async updateChatLastMessage(chatId: number): Promise<void> {
    await db
      .update(chats)
      .set({ lastMessageAt: new Date() })
      .where(eq(chats.id, chatId));
  }
  async getUserPosts(userId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(sql`${posts.createdAt} DESC`);
  }
  async deleteChat(chatId: number): Promise<void> {
    // First delete all messages in the chat
    await db.delete(messages).where(eq(messages.chatId, chatId));
    // Then delete chat participants
    await db.delete(chatParticipants).where(eq(chatParticipants.chatId, chatId));
    // Finally delete the chat itself
    await db.delete(chats).where(eq(chats.id, chatId));
  }

  async blockUser(userId: number, blockedUserId: number): Promise<void> {
    // Add user block record
    await db.insert(userBlocks).values({
      userId,
      blockedUserId,
      createdAt: new Date(),
    });
  }

  async unblockUser(userId: number, blockedUserId: number): Promise<void> {
    await db.delete(userBlocks)
      .where(eq(userBlocks.userId, userId))
      .where(eq(userBlocks.blockedUserId, blockedUserId));
  }

  async isUserBlocked(userId: number, blockedUserId: number): Promise<boolean> {
    const [block] = await db
      .select()
      .from(userBlocks)
      .where(eq(userBlocks.userId, userId))
      .where(eq(userBlocks.blockedUserId, blockedUserId));
    return !!block;
  }

  async getBlockedUsers(userId: number): Promise<User[]> {
    const blocks = await db
      .select({
        blockedUser: users,
      })
      .from(userBlocks)
      .innerJoin(users, eq(userBlocks.blockedUserId, users.id))
      .where(eq(userBlocks.userId, userId));

    return blocks.map(({ blockedUser }) => blockedUser);
  }
}

export const storage = new DatabaseStorage();