import type { Express } from "express";
import { createServer, type Server } from "http";
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

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    next();
  };

  // Posts
  app.get("/api/posts", async (req, res) => {
    const posts = await storage.getPosts();
    res.json(posts);
  });

  app.post("/api/posts", requireAuth, upload.array("images", 5), async (req, res) => {
    const parsed = insertPostSchema.parse(req.body);
    const images = (req.files as Express.Multer.File[])?.map(
      file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
    ) || [];
    
    const post = await storage.createPost(req.user!.id, {
      ...parsed,
      images,
    });
    res.json(post);
  });

  app.patch("/api/posts/:id", requireAuth, async (req, res) => {
    const post = await storage.getPost(Number(req.params.id));
    if (!post) return res.sendStatus(404);
    if (post.userId !== req.user!.id) return res.sendStatus(403);

    const parsed = insertPostSchema.partial().parse(req.body);
    const updated = await storage.updatePost(post.id, parsed);
    res.json(updated);
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
    res.json(comment);
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    const comments = await storage.getComments(Number(req.params.id));
    res.json(comments);
  });

  // Likes
  app.post("/api/posts/:id/likes", requireAuth, async (req, res) => {
    const liked = await storage.toggleLike(req.user!.id, Number(req.params.id));
    res.json({ liked });
  });

  app.get("/api/posts/:id/likes", async (req, res) => {
    const likes = await storage.getLikes(Number(req.params.id));
    res.json(likes);
  });

  const httpServer = createServer(app);
  return httpServer;
}
