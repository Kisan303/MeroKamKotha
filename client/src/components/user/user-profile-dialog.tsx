import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Post, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PostCard } from "../posts/post-card";
import { useLocation } from "wouter";

type UserProfileDialogProps = {
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserProfileDialog({ username, open, onOpenChange }: UserProfileDialogProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch user info
  const { data: profileUser, isLoading: loadingUser } = useQuery<User>({
    queryKey: ["/api/users", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: open,
  });

  // Fetch user's posts
  const { data: userPosts = [], isLoading: loadingPosts } = useQuery<Post[]>({
    queryKey: ["/api/users", username, "posts"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/posts`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
    enabled: open,
  });

  // Create chat mutation
  const createChatMutation = useMutation({
    mutationFn: async () => {
      if (!profileUser || !currentUser) return;
      const res = await apiRequest("POST", "/api/chats", {
        participantIds: [currentUser.id, profileUser.id],
      });
      if (!res.ok) throw new Error("Failed to create chat");
      return await res.json();
    },
    onSuccess: (chat) => {
      onOpenChange(false);
      navigate(`/chat/${chat.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartChat = () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please log in to start a chat",
        variant: "destructive",
      });
      return;
    }
    createChatMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh]">
        {loadingUser ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : profileUser ? (
          <ScrollArea className="h-full pr-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                <span>{profileUser.fullname}</span>
                {currentUser?.id !== profileUser.id && (
                  <Button
                    onClick={handleStartChat}
                    disabled={createChatMutation.isPending}
                    size="sm"
                    className="bg-primary"
                  >
                    {createChatMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </>
                    )}
                  </Button>
                )}
              </DialogTitle>
              <p className="text-muted-foreground">@{profileUser.username}</p>
            </DialogHeader>

            <Separator className="my-4" />

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Posts</h3>
              {loadingPosts ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No posts yet
                </p>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            User not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
