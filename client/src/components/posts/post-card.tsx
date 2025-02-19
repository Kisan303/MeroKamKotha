import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Heart, MessageSquare, Trash, Edit } from "lucide-react";
import type { Post, Comment } from "@shared/schema";
import { Separator } from "@/components/ui/separator";

type PostWithUsername = Post & { username?: string };
type CommentWithUsername = Comment & { username?: string };

export function PostCard({ post }: { post: PostWithUsername }) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  const { data: comments = [] } = useQuery<CommentWithUsername[]>({
    queryKey: ["/api/posts", post.id, "comments"],
    enabled: showComments, // Only fetch comments when comments section is shown
  });

  const { data: likes = [] } = useQuery<{ id: number; userId: number }[]>({
    queryKey: ["/api/posts", post.id, "likes"],
  });

  const isLiked = user ? likes.some((like) => like.userId === user.id) : false;

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/likes`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "likes"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/comments`, { content: comment, postId: post.id });
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "comments"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">
              Posted by {post.username || "Unknown"}
            </p>
            <h2 className="text-2xl font-bold leading-none tracking-tight">
              {post.title}
            </h2>
          </div>
          <div className="flex items-start gap-2">
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              {format(new Date(post.createdAt), "PPp")}
            </p>
            {user && user.id === post.userId && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteMutation.mutate()}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-base leading-relaxed mb-4">{post.description}</p>
        {post.type === "room" && post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {post.images.map((image, i) => (
              <img 
                key={i} 
                src={image} 
                alt={`Room ${i + 1}`} 
                className="rounded-lg object-cover w-full h-48 hover:opacity-90 transition-opacity"
              />
            ))}
          </div>
        )}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            📍 {post.location}
          </span>
          {post.price && (
            <span className="flex items-center gap-1">
              💰 ${post.price}
            </span>
          )}
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="pt-4 flex flex-col gap-4">
        <div className="flex gap-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            className="flex gap-2"
            onClick={() => likeMutation.mutate()}
            disabled={!user}
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${
                isLiked ? "fill-primary text-primary" : ""
              }`} 
            />
            {likes.length}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex gap-2" 
            disabled={!user}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4" />
            {comments.length}
          </Button>
        </div>

        {showComments && (
          <>
            <ScrollArea className="h-48 w-full rounded-md border p-4">
              {comments.map((comment) => (
                <div key={comment.id} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{comment.username || "Unknown"}</p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.createdAt), "PP")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </ScrollArea>

            {user && (
              <div className="flex gap-2 w-full">
                <Input
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <Button 
                  onClick={() => commentMutation.mutate()} 
                  disabled={!comment.trim() || commentMutation.isPending}
                >
                  Post
                </Button>
              </div>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}