import { useState, useEffect } from "react";
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
import { socket } from "@/lib/socket";

type LikeResponse = { likes: { id: number; userId: number }[]; count: number };
type PostWithUsername = Post & { username?: string };
type CommentWithUsername = Comment & { username?: string };

export function PostCard({ post }: { post: PostWithUsername }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState<number | null>(null);

  // Query for likes data
  const { data: likesData, isLoading: likesLoading } = useQuery<LikeResponse>({
    queryKey: ["/api/posts", post.id, "likes"],
    refetchInterval: false, // Using WebSocket for real-time updates
  });

  // Query for comments with proper error handling
  const { data: comments = [], isLoading: commentsLoading } = useQuery<CommentWithUsername[]>({
    queryKey: ["/api/posts", post.id, "comments"],
    queryFn: async () => {
      console.log(`Fetching comments for post ${post.id}`);
      const response = await fetch(`/api/posts/${post.id}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      console.log(`Received ${data.length} comments for post ${post.id}`, data);
      return data;
    },
    enabled: true, // Always fetch comments
    refetchOnMount: true, // Refetch when component mounts
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
  });

  const likes = likesData?.likes ?? [];
  const likeCount = optimisticLikeCount ?? likesData?.count ?? 0;
  const isLiked = user ? likes.some((like) => like.userId === user.id) : false;

  // Setup WebSocket listeners for real-time updates
  useEffect(() => {
    // Join the post's room for real-time updates
    socket.emit("join-post", post.id.toString());
    console.log(`Joined post room: ${post.id}`);

    socket.on("new-comment", (newComment: CommentWithUsername) => {
      if (newComment.postId === post.id) {
        console.log('Received new comment:', newComment);
        queryClient.setQueryData<CommentWithUsername[]>(
          ["/api/posts", post.id, "comments"],
          (old = []) => {
            // Ensure we don't add duplicate comments
            const exists = old.some(c => c.id === newComment.id);
            if (exists) return old;

            // Add new comment at the end (it's the most recent)
            return [...old, newComment];
          }
        );
      }
    });

    // Cleanup function
    return () => {
      console.log(`Leaving post room: ${post.id}`);
      socket.emit("leave-post", post.id.toString());
      socket.off("new-comment");
      socket.off("likes-updated");
    };
  }, [post.id, queryClient]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/likes`);
      return await res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/posts", post.id, "likes"] });

      const previousData = queryClient.getQueryData<LikeResponse>(["/api/posts", post.id, "likes"]);
      const newCount = isLiked ? (likeCount - 1) : (likeCount + 1);
      setOptimisticLikeCount(newCount);

      return { previousData };
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        setOptimisticLikeCount(context.previousData.count);
        queryClient.setQueryData(["/api/posts", post.id, "likes"], context.previousData);
      }
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTimeout(() => setOptimisticLikeCount(null), 1000);
    }
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/comments`, {
        content: comment,
        postId: post.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      setComment("");
      toast({
        title: "Success",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validComments = comments
    .filter((comment) => comment.content && comment.content.trim());
  // No need to sort here as we're already getting them in the correct order from the server

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
                  onClick={() => {/*deleteMutation.mutate()*/} }
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
                isLiked ? "fill-primary text-primary animate-scale" : ""
              }`}
            />
            {likesLoading ? "..." : likeCount}
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
                  <div
                    key={comment.id}
                    className={`mb-4 last:mb-0 rounded-lg p-3 transition-all duration-300 ${
                      comment.userId === user?.id
                        ? "bg-primary/10"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCircle className={`h-4 w-4 ${
                        comment.userId === user?.id ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <p className={`text-sm font-medium ${
                        comment.userId === user?.id ? "text-primary" : ""
                      }`}>
                        {comment.username || "Unknown"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a") : ""}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 pl-6 ${
                      comment.userId === user?.id
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}>
                      {comment.content}
                    </p>
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
                    if (e.key === "Enter" && !e.shiftKey && comment.trim()) {
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
                  {commentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}