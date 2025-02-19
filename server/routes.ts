import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPostSchema, insertCommentSchema } from "@shared/schema";
import multer from "multer";

// Multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Register all routes and socket events
export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Create Socket.IO server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("join-post", (postId: string) => {
      console.log(`User joined post ${postId}`);
      socket.join(`post-${postId}`);
    });

    socket.on("leave-post", (postId: string) => {
      console.log(`User left post ${postId}`);
      socket.leave(`post-${postId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ error: "Unauthorized" });
    next();
  };

  // Posts Routes
  app.get("/api/posts", async (req, res) => {
    const posts = await storage.getPosts();
    const postsWithUsernames = await Promise.all(
      posts.map(async (post) => {
        const user = await storage.getUser(post.userId);
        return { ...post, username: user?.username };
      }),
    );
    res.json(postsWithUsernames);
  });

  app.post(
    "/api/posts",
    requireAuth,
    upload.array("images", 5),
    async (req, res) => {
      try {
        const data = {
          ...req.body,
          price: req.body.price ? Number(req.body.price) : null,
        };

        const parsed = insertPostSchema.parse(data);
        const images =
          (req.files as Express.Multer.File[])?.map(
            (file) =>
              `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          ) || [];

        const post = await storage.createPost(req.user!.id, {
          ...parsed,
          images,
        });

        const user = await storage.getUser(post.userId);
        res.json({ ...post, username: user?.username });
      } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ error: "Failed to create post" });
      }
    },
  );

  app.patch("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const post = await storage.getPost(Number(req.params.id));
      if (!post) return res.sendStatus(404);
      if (post.userId !== req.user!.id) return res.sendStatus(403);

      const data = {
        ...req.body,
        price: req.body.price ? Number(req.body.price) : null,
      };
      const parsed = insertPostSchema.partial().parse(data);
      const updated = await storage.updatePost(post.id, parsed);

      const user = await storage.getUser(updated.userId);
      res.json({ ...updated, username: user?.username });
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const post = await storage.getPost(Number(req.params.id));
      if (!post) return res.sendStatus(404);
      if (post.userId !== req.user!.id) return res.sendStatus(403);

      await storage.deletePost(post.id);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // Comments Routes
  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const parsed = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(req.user!.id, parsed);
      const user = await storage.getUser(comment.userId);
      const commentWithUser = { ...comment, username: user?.username };

      // Emit new comment to all clients viewing this post
      io.to(`post-${comment.postId}`).emit("new-comment", commentWithUser);

      res.json(commentWithUser);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getComments(Number(req.params.id));
      const commentsWithUser = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.userId);
          return { ...comment, username: user?.username };
        }),
      );
      res.json(commentsWithUser);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Start server
  httpServer.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });

  return httpServer;
}
