import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Bookmark, MessageSquare, Clock, UserCircle } from "lucide-react";
import type { Post, Comment } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { socket } from "@/lib/socket";
import { CommentThread } from './comment-thread';

type BookmarkResponse = { bookmarked: boolean };
type PostWithUsername = Post & { username?: string };
type CommentWithUsername = Comment & { username?: string };

export function PostCard({ post }: { post: PostWithUsername }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fetch bookmark status for this specific post
  const { data: bookmarkData } = useQuery<BookmarkResponse>({
    queryKey: ["/api/posts", post.id, "bookmark"],
    enabled: !!user,
  });

  // Always fetch comments, just control their display with showComments
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
    staleTime: 1000 * 60,
  });

  // Update isBookmarked when bookmarkData changes for this specific post
  useEffect(() => {
    if (bookmarkData) {
      setIsBookmarked(bookmarkData.bookmarked);
    }
  }, [bookmarkData]);

  useEffect(() => {
    // Join room for this specific post
    socket.emit("join-post", post.id.toString());
    console.log(`Joined post room: ${post.id}`);

    // Handle bookmark updates for this specific post only
    socket.on("bookmark-updated", (data: { postId: number, bookmarked: boolean }) => {
      if (data.postId === post.id) {
        console.log(`Received bookmark update for post ${post.id}:`, data);
        queryClient.setQueryData<BookmarkResponse>(
          ["/api/posts", post.id, "bookmark"],
          { bookmarked: data.bookmarked }
        );
        setIsBookmarked(data.bookmarked);
      }
    });

    socket.on("new-comment", (newComment: CommentWithUsername) => {
      if (newComment.postId === post.id) {
        console.log('Received new comment:', newComment);
        queryClient.setQueryData<CommentWithUsername[]>(
          ["/api/posts", post.id, "comments"],
          (old = []) => {
            const exists = old.some(c => c.id === newComment.id);
            if (exists) return old;
            return [...old, newComment];
          }
        );
      }
    });

    return () => {
      console.log(`Leaving post room: ${post.id}`);
      socket.emit("leave-post", post.id.toString());
      socket.off("new-comment");
      socket.off("bookmark-updated");
    };
  }, [post.id, queryClient]);

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", `/api/posts/${post.id}/bookmark`);
        if (!res.ok) {
          throw new Error('Failed to update bookmark');
        }
        return await res.json();
      } catch (error) {
        console.error('Bookmark mutation error:', error);
        throw error;
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/posts", post.id, "bookmark"] });
      const previousData = queryClient.getQueryData<BookmarkResponse>(["/api/posts", post.id, "bookmark"]);
      setIsBookmarked(!isBookmarked);
      return { previousData };
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        setIsBookmarked(context.previousData.bookmarked);
        queryClient.setQueryData(["/api/posts", post.id, "bookmark"], context.previousData);
      }
      toast({
        title: "Error",
        description: "Failed to update bookmark status",
        variant: "destructive",
      });
    },
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

  // Organize comments into a tree structure
  const topLevelComments = comments.filter(comment => !comment.parentId);

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
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {format(new Date(post.createdAt), "PPp")}
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
            onClick={() => bookmarkMutation.mutate()}
            disabled={!user || bookmarkMutation.isPending}
          >
            <Bookmark
              className={`h-4 w-4 transition-colors ${
                isBookmarked ? "fill-primary text-primary animate-scale" : ""
              }`}
            />
            {isBookmarked ? "Saved" : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex gap-2"
            disabled={!user}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4" />
            {commentsLoading ? "..." : comments.length}
          </Button>
        </div>

        {showComments && (
          <>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              {commentsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
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
                topLevelComments.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    replies={comments}
                    currentUser={user}
                    postId={post.id}
                  />
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