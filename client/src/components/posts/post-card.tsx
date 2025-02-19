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

type PostWithUsername = Post & { username?: string };
type CommentWithUsername = Comment & { username?: string };

export function PostCard({ post }: { post: PostWithUsername }) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");

  const { data: comments = [] } = useQuery<CommentWithUsername[]>({
    queryKey: ["/api/posts", post.id, "comments"],
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <h3 className="font-semibold">{post.title}</h3>
          <p className="text-sm text-muted-foreground">
            Posted by {post.username || "Unknown"} on {format(new Date(post.createdAt), "PP")}
          </p>
        </div>
        {user && user.id === post.userId && (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate()}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p>{post.description}</p>
        {post.type === "room" && post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.images.map((image, i) => (
              <img key={i} src={image} alt={`Room ${i + 1}`} className="rounded-md object-cover aspect-video" />
            ))}
          </div>
        )}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>📍 {post.location}</span>
          {post.price && <span>💰 ${post.price}</span>}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex gap-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            className="flex gap-2"
            onClick={() => likeMutation.mutate()}
            disabled={!user}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-primary" : ""}`} />
            {likes.length}
          </Button>
          <Button variant="ghost" size="sm" className="flex gap-2" disabled={!user}>
            <MessageSquare className="h-4 w-4" />
            {comments.length}
          </Button>
        </div>
        <ScrollArea className="h-24 w-full">
          {comments.map((comment) => (
            <div key={comment.id} className="py-2">
              <p className="text-sm font-medium">{comment.username || "Unknown"}</p>
              <p className="text-sm text-muted-foreground">{comment.content}</p>
            </div>
          ))}
        </ScrollArea>
        {user && (
          <div className="flex gap-2 w-full">
            <Input
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button onClick={() => commentMutation.mutate()} disabled={!comment.trim()}>
              Comment
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}