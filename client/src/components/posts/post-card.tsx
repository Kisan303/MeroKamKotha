import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  Bookmark,
  MessageSquare,
  Clock,
  UserCircle,
  MoreVertical,
  Edit,
  Trash,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Post, Comment } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { socket } from "@/lib/socket";
import { CommentThread } from './comment-thread';
import { Input } from "@/components/ui/input";
import { PostForm } from "./post-form";
import { ImageSlider } from "./image-slider";
import { UserProfileDialog } from "@/components/user/user-profile-dialog";
import { AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";


type BookmarkResponse = { bookmarked: boolean };
type PostWithUsername = Post & { username?: string };
type CommentWithUsername = Comment & { username?: string };

type PostCardProps = {
  post: PostWithUsername;
  inSavedPosts?: boolean;
};

export function PostCard({ post, inSavedPosts = false }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showUnsaveConfirm, setShowUnsaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // Function to check if description is long
  const isLongDescription = post.description.length > 150;

  // Function to get truncated description
  const getTruncatedDescription = () => {
    if (!isLongDescription || isDescriptionExpanded) {
      return post.description;
    }
    return post.description.slice(0, 150) + "...";
  };

  const { data: bookmarkData } = useQuery<BookmarkResponse>({
    queryKey: ["/api/posts", post.id, "bookmark"],
    enabled: !!user,
  });

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

  useEffect(() => {
    if (bookmarkData) {
      setIsBookmarked(bookmarkData.bookmarked);
    }
  }, [bookmarkData]);

  useEffect(() => {
    socket.emit("join-post", post.id.toString());
    console.log(`Joined post room: ${post.id}`);

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
      const newBookmarked = !isBookmarked;
      setIsBookmarked(newBookmarked);
      queryClient.setQueryData(["/api/posts", post.id, "bookmark"], { bookmarked: newBookmarked });
      return { previousData };
    },
    onSuccess: (data) => {
      setIsBookmarked(data.bookmarked);
      queryClient.setQueryData(["/api/posts", post.id, "bookmark"], { bookmarked: data.bookmarked });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookmarks"] });
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
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const topLevelComments = comments.filter(comment => !comment.parentId);

  const handleBookmarkClick = () => {
    if (inSavedPosts && isBookmarked) {
      setShowUnsaveConfirm(true);
    } else {
      bookmarkMutation.mutate();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="will-change-transform"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-card to-muted/5 border-muted-foreground/10 hover:border-primary/20 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                <button
                  onClick={() => setShowProfileDialog(true)}
                  className="text-sm font-medium hover:underline"
                >
                  {post.username || "Unknown"}
                </button>
              </div>
              <motion.h2
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold leading-none tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
              >
                {post.title}
              </motion.h2>
            </motion.div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {format(new Date(post.createdAt), "PPp")}
                {post.editedAt && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (edited {format(new Date(post.editedAt), "PPp")})
                  </span>
                )}
              </div>
              {user && post.userId === user.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3 space-y-4">
          <div className="space-y-2">
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`text-base leading-relaxed ${!isDescriptionExpanded && isLongDescription ? 'line-clamp-3' : ''}`}
            >
              {getTruncatedDescription()}
            </motion.p>

            {isLongDescription && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                {isDescriptionExpanded ? (
                  <>
                    Show Less <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Show More <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>

          {post.type === "room" && post.images && post.images.length > 0 && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative -mx-6 px-6"
            >
              <ImageSlider images={post.images} />
            </motion.div>
          )}

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-1">
              📍 {post.location}
            </span>
            {post.price && (
              <span className="flex items-center gap-1">
                💰 ${post.price.toLocaleString()}
              </span>
            )}
          </motion.div>
        </CardContent>

        <Separator />

        <CardFooter className="pt-4">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full space-y-4"
          >
            <div className="flex gap-4">
              {user && post.userId !== user.id && (
                <Button
                  variant={isBookmarked ? "default" : "ghost"}
                  size="sm"
                  className={`flex gap-2 transition-all duration-200 ${
                    isBookmarked
                      ? "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  }`}
                  onClick={handleBookmarkClick}
                  disabled={bookmarkMutation.isPending}
                >
                  <Bookmark
                    className={`h-5 w-5 transition-all duration-300 ${
                      isBookmarked
                        ? "fill-blue-600 text-blue-600 animate-scale"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className={isBookmarked ? "text-blue-600 font-medium" : ""}>
                    {isBookmarked ? "Saved" : "Save"}
                  </span>
                </Button>
              )}
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

            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
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
                      <div className="space-y-4">
                        {topLevelComments.map((comment) => (
                          <CommentThread
                            key={comment.id}
                            comment={comment}
                            replies={comments}
                            currentUser={user}
                            postId={post.id}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {user && (
                    <div className="flex gap-2 w-full mt-4">
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
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </CardFooter>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <PostForm initialData={post} onSuccess={() => setShowEditDialog(false)} />
          </DialogContent>
        </Dialog>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this post? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  deleteMutation.mutate();
                  setShowDeleteConfirm(false);
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {post.username && (
          <UserProfileDialog
            username={post.username}
            open={showProfileDialog}
            onOpenChange={setShowProfileDialog}
          />
        )}
      </Card>
    </motion.div>
  );
}