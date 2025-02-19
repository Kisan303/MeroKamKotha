import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPostSchema, insertCommentSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

  // Socket.IO connection handling
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

  app.post("/api/posts", requireAuth, upload.array("images", 5), async (req, res) => {
    const data = {
      ...req.body,
      price: req.body.price ? Number(req.body.price) : null,
    };

    const parsed = insertPostSchema.parse(data);
    const images = (req.files as Express.Multer.File[])?.map(
      file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
    ) || [];

    const post = await storage.createPost(req.user!.id, {
      ...parsed,
      images,
    });

    const user = await storage.getUser(post.userId);
    res.json({ ...post, username: user?.username });
  });

  app.patch("/api/posts/:id", requireAuth, async (req, res) => {
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
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    const post = await storage.getPost(Number(req.params.id));
    if (!post) return res.sendStatus(404);
    if (post.userId !== req.user!.id) return res.sendStatus(403);

    await storage.deletePost(post.id);
    res.sendStatus(200);
  });

  // Comments
  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    const parsed = insertCommentSchema.parse(req.body);
    const comment = await storage.createComment(req.user!.id, parsed);
    const user = await storage.getUser(comment.userId);
    const commentWithUser = { ...comment, username: user?.username };

    // Emit new comment to all clients viewing this post
    io.to(`post-${comment.postId}`).emit("new-comment", commentWithUser);

    res.json(commentWithUser);
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    const comments = await storage.getComments(Number(req.params.id));
    const commentsWithUsernames = await Promise.all(
      comments.map(async (comment) => {
        const user = await storage.getUser(comment.userId);
        return { ...comment, username: user?.username };
      })
    );
    res.json(commentsWithUsernames);
  });

  // Likes
  app.post("/api/posts/:id/likes", requireAuth, async (req, res) => {
    try {
      const liked = await storage.toggleLike(req.user!.id, Number(req.params.id));
      const likes = await storage.getLikes(Number(req.params.id));
      const response = { liked, count: likes.length };

      // Emit updated likes to all clients viewing this post
      io.to(`post-${req.params.id}`).emit("likes-updated", response);

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  app.get("/api/posts/:id/likes", async (req, res) => {
    try {
      const likes = await storage.getLikes(Number(req.params.id));
      res.json({ likes, count: likes.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to get likes" });
    }
  });

  return httpServer;
}