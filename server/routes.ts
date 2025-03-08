import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPostSchema, insertCommentSchema, insertChatSchema, insertMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for storing files
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Create Socket.IO server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    next();
  };

  // Posts
  app.get("/api/posts", async (req, res) => {
    const posts = await storage.getPosts();
    const postsWithUsernames = await Promise.all(
      posts.map(async (post) => {
        const user = await storage.getUser(post.userId);
        return { ...post, username: user?.username };
      })
    );
    res.json(postsWithUsernames);
  });

  app.post("/api/posts", requireAuth, upload.array('images', 5), async (req, res) => {
    try {
      console.log("Creating post with data:", req.body);
      console.log("Files received:", req.files);

      const files = req.files as Express.Multer.File[];
      let imageUrls: string[] = [];

      if (req.body.type === "room") {
        if (!files || files.length === 0) {
          return res.status(400).json({ error: "At least one image is required for room posts" });
        }
        // Convert uploaded files to URLs
        imageUrls = files.map(file => `/uploads/${file.filename}`);
      }

      const data = {
        ...req.body,
        price: req.body.price ? Number(req.body.price) : null,
        images: imageUrls
      };

      console.log("Parsed data:", data);

      const parsed = insertPostSchema.parse(data);
      const post = await storage.createPost(req.user!.id, parsed);

      const user = await storage.getUser(post.userId);
      const postWithUser = { ...post, username: user?.username };

      // Emit new post to all connected clients
      io.emit("new-post", postWithUser);

      res.json(postWithUser);
    } catch (error) {
      console.error("Error creating post:", error);
      // Clean up uploaded files if there's an error
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
      }
      res.status(400).json({ error: error.message || "Failed to create post" });
    }
  });

  app.patch("/api/posts/:id", requireAuth, async (req, res) => {
    const post = await storage.getPost(Number(req.params.id));
    if (!post) return res.sendStatus(404);
    if (post.userId !== req.user!.id) return res.sendStatus(403);

    const data = {
      ...req.body,
      price: req.body.price ? Number(req.body.price) : null,
      editedAt: new Date(), // Add editedAt timestamp
    };

    const parsed = insertPostSchema.partial().parse(data);
    const updated = await storage.updatePost(post.id, parsed);
    const user = await storage.getUser(updated.userId);
    const postWithUser = { ...updated, username: user?.username };

    // Emit post update to all connected clients
    io.emit("post-updated", postWithUser);

    res.json(postWithUser);
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    const post = await storage.getPost(Number(req.params.id));
    if (!post) return res.sendStatus(404);
    if (post.userId !== req.user!.id) return res.sendStatus(403);

    await storage.deletePost(post.id);

    // Emit post deletion to all connected clients
    io.emit("post-deleted", post.id);

    res.sendStatus(200);
  });

  // Comments
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      console.log(`[GET /api/posts/${postId}/comments] Start fetching comments`);

      // Get comments from storage
      const comments = await storage.getComments(postId);
      console.log(`[GET /api/posts/${postId}/comments] Retrieved ${comments.length} comments from storage`);

      // Get usernames for each comment
      console.log(`[GET /api/posts/${postId}/comments] Fetching usernames for comments`);
      const commentsWithUsernames = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.userId);
          return { ...comment, username: user?.username };
        })
      );

      console.log(`[GET /api/posts/${postId}/comments] Sending ${commentsWithUsernames.length} comments with usernames`);
      console.log('Comments data:', commentsWithUsernames);

      res.json(commentsWithUsernames);
    } catch (error) {
      console.error('[GET /api/posts/:id/comments] Error:', error);
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      console.log(`[POST /api/posts/${req.params.id}/comments] Creating new comment...`);
      const parsed = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(req.user!.id, parsed);
      const user = await storage.getUser(comment.userId);
      const commentWithUser = { ...comment, username: user?.username };

      console.log(`[POST /api/posts/${req.params.id}/comments] Emitting new comment to room: post-${comment.postId}`);
      // Emit new comment to all clients viewing this post
      io.to(`post-${comment.postId}`).emit("new-comment", commentWithUser);

      res.json(commentWithUser);
    } catch (error) {
      console.error('[POST /api/posts/:id/comments] Error:', error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.patch("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const commentId = Number(req.params.id);
      const comment = await storage.getComment(commentId);

      // Check if comment exists and belongs to the user
      if (!comment || comment.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to edit this comment" });
      }

      const updatedComment = await storage.updateComment(commentId, req.body.content);
      const user = await storage.getUser(updatedComment.userId);
      const commentWithUser = { ...updatedComment, username: user?.username };

      // Emit updated comment to all clients viewing this post
      io.to(`post-${updatedComment.postId}`).emit("comment-updated", commentWithUser);

      res.json(commentWithUser);
    } catch (error) {
      console.error('[PATCH /api/comments/:id] Error:', error);
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const commentId = Number(req.params.id);
      const comment = await storage.getComment(commentId);

      // Check if comment exists and belongs to the user
      if (!comment || comment.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this comment" });
      }

      await storage.deleteComment(commentId);

      // Emit deletion event to all clients viewing this post
      io.to(`post-${comment.postId}`).emit("comment-deleted", commentId);

      res.sendStatus(200);
    } catch (error) {
      console.error('[DELETE /api/comments/:id] Error:', error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Bookmarks
  app.post("/api/posts/:id/bookmark", requireAuth, async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const userId = req.user!.id;

      // Validate post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      console.log(`Toggling bookmark for post ${postId} by user ${userId}`);
      const isBookmarked = await storage.toggleBookmark(userId, postId);
      const bookmarks = await storage.getBookmarks(userId);
      const response = { bookmarked: isBookmarked, count: bookmarks.length, postId };

      console.log(`Bookmark status updated:`, response);

      res.json(response);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      res.status(500).json({ error: "Failed to toggle bookmark" });
    }
  });

  app.get("/api/posts/:id/bookmark", requireAuth, async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const userId = req.user!.id;

      console.log(`Checking bookmark status for post ${postId} by user ${userId}`);
      const isBookmarked = await storage.isBookmarked(userId, postId);

      res.json({ bookmarked: isBookmarked });
    } catch (error) {
      console.error('Error getting bookmark status:', error);
      res.status(500).json({ error: "Failed to get bookmark status" });
    }
  });

  // Add endpoint to get bookmarked posts for user profile
  app.get("/api/user/bookmarks", requireAuth, async (req, res) => {
    try {
      const bookmarks = await storage.getBookmarks(req.user!.id);
      const bookmarkedPosts = await Promise.all(
        bookmarks.map(async (bookmark) => {
          const post = await storage.getPost(bookmark.postId);
          // Skip if post is deleted
          if (!post) return null;
          const user = await storage.getUser(post.userId);
          return { ...post, username: user?.username };
        })
      );
      // Filter out null values (deleted posts)
      res.json(bookmarkedPosts.filter(Boolean));
    } catch (error) {
      res.status(500).json({ error: "Failed to get bookmarked posts" });
    }
  });


  // Add these routes after the existing user routes
  app.get("/api/users/:username", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get("/api/users/:username/posts", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const posts = await storage.getUserPosts(user.id);
      const postsWithUsernames = await Promise.all(
        posts.map(async (post) => {
          const postUser = await storage.getUser(post.userId);
          return { ...post, username: postUser?.username };
        })
      );
      res.json(postsWithUsernames);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user posts" });
    }
  });

  // Chat endpoints
  app.get("/api/chats", requireAuth, async (req, res) => {
    try {
      const chats = await storage.getUserChats(req.user!.id);
      const chatsWithDetails = await Promise.all(
        chats.map(async (chat) => {
          const participants = await storage.getChatParticipants(chat.id);
          const lastMessage = await storage.getLastMessage(chat.id);
          return {
            ...chat,
            participants,
            lastMessage,
          };
        })
      );
      res.json(chatsWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chats" });
    }
  });

  // Update the chat creation route with better error handling
  app.post("/api/chats", requireAuth, async (req, res) => {
    try {
      console.log("Creating chat with data:", req.body);
      const parsed = insertChatSchema.parse(req.body);

      // Validate that the current user is included in participants
      if (!parsed.participantIds.includes(req.user!.id)) {
        parsed.participantIds.push(req.user!.id);
      }

      // Validate that all participants exist
      for (const participantId of parsed.participantIds) {
        const participant = await storage.getUser(participantId);
        if (!participant) {
          return res.status(400).json({ error: `User with ID ${participantId} not found` });
        }
      }

      const chat = await storage.createChat(parsed.participantIds);
      const participants = await storage.getChatParticipants(chat.id);

      console.log("Created chat:", chat);
      console.log("Participants:", participants);

      // Format response with user details
      const response = {
        ...chat,
        participants,
        lastMessage: null
      };

      res.json(response);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(400).json({ error: error.message || "Failed to create chat" });
    }
  });

  app.get("/api/chats/:id/messages", requireAuth, async (req, res) => {
    try {
      const chatId = Number(req.params.id);
      const messages = await storage.getChatMessages(chatId);
      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
          const user = await storage.getUser(message.userId);
          return { ...message, user };
        })
      );
      res.json(messagesWithUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  app.post("/api/chats/:id/messages", requireAuth, async (req, res) => {
    try {
      const chatId = Number(req.params.id);
      const parsed = insertMessageSchema.parse({ ...req.body, chatId });
      const message = await storage.createMessage(req.user!.id, parsed);
      const user = await storage.getUser(message.userId);

      // Update last message timestamp
      await storage.updateChatLastMessage(chatId);

      const messageWithUser = { ...message, user };

      // Emit new message to all clients in this chat room
      io.to(`chat-${chatId}`).emit("new-message", messageWithUser);

      res.json(messageWithUser);
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(400).json({ error: error.message || "Failed to send message" });
    }
  });

  // Delete chat
  app.delete("/api/chats/:id", requireAuth, async (req, res) => {
    try {
      const chatId = Number(req.params.id);
      const chat = await storage.getChatMessages(chatId);

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      // Check if user is a participant
      const participants = await storage.getChatParticipants(chatId);
      if (!participants.some(p => p.id === req.user!.id)) {
        return res.status(403).json({ error: "Not authorized to delete this chat" });
      }

      await storage.deleteChat(chatId);

      // Emit chat deletion to all participants
      participants.forEach(participant => {
        io.to(`user-${participant.id}`).emit("chat-deleted", chatId);
      });

      res.sendStatus(200);
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ error: "Failed to delete chat" });
    }
  });

  // Block user
  app.post("/api/users/:id/block", requireAuth, async (req, res) => {
    try {
      const blockedUserId = Number(req.params.id);
      const userId = req.user!.id;

      if (blockedUserId === userId) {
        return res.status(400).json({ error: "Cannot block yourself" });
      }

      const blockedUser = await storage.getUser(blockedUserId);
      if (!blockedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.blockUser(userId, blockedUserId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  // Unblock user
  app.delete("/api/users/:id/block", requireAuth, async (req, res) => {
    try {
      const blockedUserId = Number(req.params.id);
      await storage.unblockUser(req.user!.id, blockedUserId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ error: "Failed to unblock user" });
    }
  });

  // Get blocked users
  app.get("/api/users/blocked", requireAuth, async (req, res) => {
    try {
      const blockedUsers = await storage.getBlockedUsers(req.user!.id);
      res.json(blockedUsers);
    } catch (error) {
      console.error("Error getting blocked users:", error);
      res.status(500).json({ error: "Failed to get blocked users" });
    }
  });

  // Update Socket.IO connection handling to include chat rooms
  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("join-chat", (chatId: string) => {
      socket.join(`chat-${chatId}`);
    });

    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat-${chatId}`);
    });

    socket.on("join-post", (postId: string) => {
      socket.join(`post-${postId}`);
    });

    socket.on("leave-post", (postId: string) => {
      socket.leave(`post-${postId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  return httpServer;
}