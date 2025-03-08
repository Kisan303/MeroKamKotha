import { useQuery } from "@tanstack/react-query";
import { type Chat, type User } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type ChatWithParticipants = Chat & {
  participants: User[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
};

export function ChatList({ onSelectChat }: { onSelectChat: (chat: ChatWithParticipants) => void }) {
  const { user: currentUser } = useAuth();
  const { data: chats = [], isLoading } = useQuery<ChatWithParticipants[]>({
    queryKey: ["/api/chats"],
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
      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold mb-4">Messages</h2>
        {chats.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start a chat by clicking on a user's profile</p>
          </div>
        ) : (
          chats.map((chat) => {
            // Find the other participant
            const otherParticipant = chat.participants.find(p => p.id !== currentUser?.id);
            if (!otherParticipant) return null;

            return (
              <button
                key={chat.id}
                className="w-full p-4 text-left hover:bg-accent rounded-lg transition-colors border border-border/50 hover:border-border"
                onClick={() => onSelectChat(chat)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium leading-none">
                      {otherParticipant.fullname || otherParticipant.username}
                    </p>
                    {chat.lastMessage && (
                      <>
                        <p className="text-sm text-muted-foreground truncate mt-2">
                          {chat.lastMessage.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(chat.lastMessage.createdAt), "PP p")}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}