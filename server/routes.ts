import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPostSchema, insertCommentSchema } from "@shared/schema";

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

  // Setup Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log("Client connected");

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

  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      console.log("Creating post with data type:", req.body.type);
      console.log("Image data present:", !!req.body.images);

      // For room posts, validate images
      if (req.body.type === "room" && (!req.body.images || !Array.isArray(req.body.images) || req.body.images.length === 0)) {
        console.log("Image validation failed for room post");
        return res.status(400).json({ error: "At least one image is required for room posts" });
      }

      const data = {
        ...req.body,
        price: req.body.price ? Number(req.body.price) : null,
      };

      console.log("Data before parsing:", data);

      const parsed = insertPostSchema.parse(data);
      console.log("Parsed data:", parsed);

      const post = await storage.createPost(req.user!.id, parsed);
      console.log("Post created:", post);

      const user = await storage.getUser(post.userId);
      const postWithUser = { ...post, username: user?.username };

      // Emit new post to all connected clients
      io.emit("new-post", postWithUser);

      res.json(postWithUser);
    } catch (error) {
      console.error("Error creating post:", error);
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

  return httpServer;
}