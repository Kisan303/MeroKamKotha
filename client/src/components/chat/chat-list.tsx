import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Chat, type User } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

type ChatWithParticipants = Chat & {
  participants: User[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
};

export function ChatList({ onSelectChat }: { onSelectChat: (chat: ChatWithParticipants) => void }) {
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
        {chats.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No conversations yet</p>
            <p className="text-sm">Start a chat by clicking on a user's profile</p>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              className="w-full p-4 text-left hover:bg-accent rounded-lg transition-colors"
              onClick={() => onSelectChat(chat)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">
                    {chat.participants.map(p => p.username).join(", ")}
                  </p>
                  {chat.lastMessage && (
                    <>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {chat.lastMessage.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(chat.lastMessage.createdAt), "PPp")}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </ScrollArea>
  );
}