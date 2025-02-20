import { useState } from "react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserCircle, MoreVertical, Edit, Trash, Check, X, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Comment, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CommentWithUsername = Comment & { username?: string };

interface CommentThreadProps {
  comment: CommentWithUsername;
  replies: CommentWithUsername[];
  currentUser: User | null;
  postId: number;
  level?: number;
}

export function CommentThread({ comment, replies, currentUser, postId, level = 0 }: CommentThreadProps) {
  const { toast } = useToast();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [showReplies, setShowReplies] = useState(false);

  const replyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${postId}/comments`, {
        content: replyContent,
        postId,
        parentId: comment.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      setReplyContent("");
      setIsReplying(false);
      toast({
        title: "Success",
        description: "Your reply has been posted successfully.",
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

  const editCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const res = await apiRequest("PATCH", `/api/comments/${id}`, { content });
      return await res.json();
    },
    onSuccess: (updatedComment) => {
      queryClient.setQueryData<CommentWithUsername[]>(
        ["/api/posts", postId, "comments"],
        (old = []) => old.map(c => c.id === updatedComment.id ? updatedComment : c)
      );
      setEditingCommentId(null);
      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/comments/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<CommentWithUsername[]>(
        ["/api/posts", postId, "comments"],
        (old = []) => old.filter(c => c.id !== deletedId)
      );
      setCommentToDelete(null);
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    },
  });

  // Only allow nesting up to 3 levels
  const canReply = level < 3;
  const nestedReplies = replies.filter(reply => reply.parentId === comment.id);
  const hasReplies = nestedReplies.length > 0;

  return (
    <div className={`relative ${level > 0 ? 'ml-6 mt-2' : 'mt-4'}`}>
      {/* Thread line */}
      {level > 0 && (
        <div className="absolute -left-4 top-0 bottom-0 w-px bg-border" />
      )}

      <div className={`rounded-lg p-3 transition-all duration-300 ${
        comment.userId === currentUser?.id
          ? "bg-blue-100 dark:bg-blue-900/30"
          : "bg-gray-100 dark:bg-gray-800/50"
      } ${comment.editedAt ? 'animate-highlight' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCircle className={`h-4 w-4 ${
              comment.userId === currentUser?.id ? "text-blue-600" : "text-muted-foreground"
            }`} />
            <p className={`text-sm font-medium ${
              comment.userId === currentUser?.id ? "text-blue-600" : ""
            }`}>
              {comment.username || "Unknown"}
            </p>
            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
              {comment.editedAt && (
                <span className="ml-1 italic">
                  (edited {format(new Date(comment.editedAt), "MMM d 'at' h:mm a")})
                </span>
              )}
            </span>
          </div>

          {currentUser && comment.userId === currentUser.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setEditingCommentId(comment.id);
                  setEditContent(comment.content);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setCommentToDelete(comment.id)}
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {editingCommentId === comment.id ? (
          <div className="flex gap-2 mt-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => {
                editCommentMutation.mutate({
                  id: comment.id,
                  content: editContent,
                });
              }}
              disabled={!editContent.trim() || editCommentMutation.isPending}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingCommentId(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-1.5 pl-6">
            <p className={`text-sm ${
              comment.userId === currentUser?.id
                ? "text-blue-900 dark:text-blue-100 font-medium"
                : "text-gray-700 dark:text-gray-300"
            }`}>
              {comment.content}
            </p>
            <div className="flex gap-2 mt-2">
              {currentUser && canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-muted-foreground"
                >
                  {showReplies ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  {showReplies ? "Hide" : "Show"} {nestedReplies.length} {nestedReplies.length === 1 ? "Reply" : "Replies"}
                </Button>
              )}
            </div>
          </div>
        )}

        {isReplying && (
          <div className="mt-2 pl-6">
            <div className="flex gap-2">
              <Input
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => replyMutation.mutate()}
                disabled={!replyContent.trim() || replyMutation.isPending}
              >
                Reply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {showReplies && nestedReplies.map((reply) => (
        <CommentThread
          key={reply.id}
          comment={reply}
          replies={replies}
          currentUser={currentUser}
          postId={postId}
          level={level + 1}
        />
      ))}

      <AlertDialog open={commentToDelete !== null} onOpenChange={(open) => setCommentToDelete(open ? commentToDelete : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (commentToDelete) {
                  deleteCommentMutation.mutate(commentToDelete);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}