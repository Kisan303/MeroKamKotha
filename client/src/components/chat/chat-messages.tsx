import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Message, type User } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { socket } from "@/lib/socket";
import { Loader2, MessageSquare, Check, CheckCheck } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

type MessageWithUser = Message & {
  user: User;
};

export function ChatMessages({ chatId }: { chatId: number }) {
  const { user: currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/chats", chatId, "messages"],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!chatId,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    socket.emit("join-chat", chatId.toString());

    socket.on("new-message", (newMessage: MessageWithUser) => {
      if (newMessage.chatId === chatId) {
        queryClient.setQueryData<MessageWithUser[]>(
          ["/api/chats", chatId, "messages"],
          (old = []) => {
            const exists = old.some(m => m.id === newMessage.id);
            if (exists) return old;
            return [...old, newMessage];
          }
        );
      }
    });

    return () => {
      socket.emit("leave-chat", chatId.toString());
      socket.off("new-message");
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groupMessagesByDate = () => {
    const groups: { [date: string]: MessageWithUser[] } = {};
    messages.forEach(message => {
      const date = format(new Date(message.createdAt), 'PP');
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <ScrollArea className="h-[calc(100vh-8rem)] px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="space-y-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              <div className="sticky top-0 z-10 flex justify-center">
                <span className="bg-primary/10 px-3 py-1 rounded-full text-xs text-primary">
                  {date}
                </span>
              </div>
              {dateMessages.map((message, idx) => {
                const isOwnMessage = message.userId === currentUser?.id;
                const showAvatar = !isOwnMessage && (!dateMessages[idx - 1] || dateMessages[idx - 1].userId !== message.userId);

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end gap-2",
                      isOwnMessage ? "justify-end" : "justify-start"
                    )}
                  >
                    {showAvatar && !isOwnMessage && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {message.user.username.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[70%] space-y-1",
                      !showAvatar && !isOwnMessage && "ml-10"
                    )}>
                      {showAvatar && !isOwnMessage && (
                        <p className="text-xs text-muted-foreground ml-1">
                          {message.user.username}
                        </p>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl p-3 shadow-sm relative",
                          isOwnMessage ? 
                            "bg-primary text-primary-foreground rounded-br-none" : 
                            "bg-card rounded-bl-none"
                        )}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] opacity-70">
                            {format(new Date(message.createdAt), "p")}
                          </span>
                          {isOwnMessage && (
                            <CheckCheck className="h-3 w-3 opacity-70" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}