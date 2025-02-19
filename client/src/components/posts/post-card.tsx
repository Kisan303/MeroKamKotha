import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Heart, MessageSquare, Trash, Edit, Clock, UserCircle } from "lucide-react";
import type { Post, Comment } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

type PostWithUsername = Post & { username?: string };
type CommentWithUsername = Comment & { username?: string };

export function PostCard({ post }: { post: PostWithUsername }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  // Always fetch comments to keep them synchronized
  const { data: comments = [], isLoading: commentsLoading } = useQuery<CommentWithUsername[]>({
    queryKey: ["/api/posts", post.id, "comments"],
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
  });

  const { data: likes = [], isLoading: likesLoading } = useQuery<{ id: number; userId: number }[]>({
    queryKey: ["/api/posts", post.id, "likes"],
    staleTime: 0,
  });

  const isLiked = user ? likes.some((like) => like.userId === user.id) : false;

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/likes`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "likes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/comments`, { 
        content: comment, 
        postId: post.id 
      });
      return await res.json();
    },
    onSuccess: (newComment: CommentWithUsername) => {
      setComment("");
      // Immediately update the UI with the new comment
      queryClient.setQueryData(
        ["/api/posts", post.id, "comments"],
        (oldComments: CommentWithUsername[] = []) => {
          return [...oldComments, { ...newComment, username: user?.username }];
        }
      );

      toast({
        title: "Success",
        description: "Your comment has been posted successfully.",
      });

      // Force a refresh of comments
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "comments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    },
  });

  // Filter out invalid comments
  const validComments = comments.filter(comment => comment.content && comment.content.trim());

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium">
                {post.username || "Unknown"}
              </p>
            </div>
            <h2 className="text-2xl font-bold leading-none tracking-tight">
              {post.title}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(post.createdAt), "PPp")}
            </div>
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
          <div className="flex overflow-x-auto gap-4 mb-4 pb-2">
            {post.images.map((image, i) => (
              <img 
                key={i} 
                src={image} 
                alt={`Room ${i + 1}`} 
                className="rounded-lg object-cover w-72 h-48 flex-none hover:opacity-90 transition-opacity"
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
            disabled={!user || likeMutation.isPending}
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${
                isLiked ? "fill-primary text-primary" : ""
              }`} 
            />
            {likesLoading ? "..." : likes.length}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex gap-2" 
            disabled={!user}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4" />
            {commentsLoading ? "..." : validComments.length}
          </Button>
        </div>

        {showComments && (
          <>
            <ScrollArea className="h-48 w-full rounded-md border p-4">
              {commentsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Loading comments...</p>
                </div>
              ) : validComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground text-center">
                    No comments yet.
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Be the first to share your thoughts!
                  </p>
                </div>
              ) : (
                validComments.map((comment) => (
                  <div key={comment.id} className="mb-4 last:mb-0 hover:bg-muted/50 rounded-lg p-2 transition-colors">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{comment.username || "Unknown"}</p>
                      <span className="text-xs text-muted-foreground">
                        {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a") : ""}
                      </span>
                    </div>
                    <p className="text-sm mt-1 pl-6">{comment.content}</p>
                  </div>
                ))
              )}
            </ScrollArea>

            {user && (
              <div className="flex gap-2 w-full">
                <Input
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && comment.trim()) {
                      e.preventDefault();
                      commentMutation.mutate();
                    }
                  }}
                />
                <Button 
                  onClick={() => commentMutation.mutate()} 
                  disabled={!comment.trim() || commentMutation.isPending}
                  className="whitespace-nowrap"
                >
                  {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}