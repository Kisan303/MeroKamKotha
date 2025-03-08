import { useQuery, useMutation } from "@tanstack/react-query";
import { type Chat, type User } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Loader2, MessageSquare, MoreVertical, Trash2, Ban } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { socket } from "@/lib/socket";

type ChatWithParticipants = Chat & {
  participants: User[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
};

interface ChatListProps {
  onSelectChat: (chat: ChatWithParticipants) => void;
  selectedChatId?: number;
  onlineUsers: Set<number>;
}

export function ChatList({ onSelectChat, selectedChatId, onlineUsers }: ChatListProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [chatToDelete, setChatToDelete] = useState<number | null>(null);

  const { data: chats = [], isLoading } = useQuery<ChatWithParticipants[]>({
    queryKey: ["/api/chats"],
  });


  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: number) => {
      const res = await apiRequest("DELETE", `/api/chats/${chatId}`);
      if (!res.ok) throw new Error("Failed to delete chat");
    },
    onSuccess: (_, chatId) => {
      queryClient.setQueryData<ChatWithParticipants[]>(["/api/chats"], (old = []) =>
        old.filter((chat) => chat.id !== chatId)
      );
      toast({
        title: "Chat deleted",
        description: "The chat has been deleted successfully.",
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

  const blockUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/users/${userId}/block`);
      if (!res.ok) throw new Error("Failed to block user");
    },
    onSuccess: () => {
      toast({
        title: "User blocked",
        description: "You will no longer receive messages from this user.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] border-r">
      <div className="p-4 space-y-1">
        <h2 className="text-lg font-semibold px-2 mb-4">Messages</h2>
        {chats.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start a chat by clicking on a user's profile</p>
          </div>
        ) : (
          chats.map((chat) => {
            const otherParticipant = chat.participants?.find(p => p.id !== currentUser?.id);
            if (!otherParticipant) return null;

            const isOnline = onlineUsers.has(otherParticipant.id);

            return (
              <div
                key={chat.id}
                className={cn(
                  "relative group",
                  selectedChatId === chat.id && "bg-accent"
                )}
              >
                <div
                  className={cn(
                    "p-3 flex items-start gap-3 hover:bg-accent/50 rounded-lg transition-colors cursor-pointer",
                    selectedChatId === chat.id && "bg-accent"
                  )}
                  onClick={() => onSelectChat(chat)}
                >
                  {/* Avatar with Online Status */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-medium text-primary">
                        {otherParticipant.username.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {otherParticipant.fullname || otherParticipant.username}
                      </p>
                      {chat.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(chat.lastMessage.createdAt), "p")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                      {chat.lastMessage && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground truncate flex-1">
                            {chat.lastMessage.content}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      size="icon"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setChatToDelete(chat.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => blockUserMutation.mutate(otherParticipant.id)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Block User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog open={!!chatToDelete} onOpenChange={() => setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat history? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (chatToDelete) {
                  deleteChatMutation.mutate(chatToDelete);
                  setChatToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
}