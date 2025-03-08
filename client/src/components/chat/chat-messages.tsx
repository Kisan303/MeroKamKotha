import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Message, type User } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { socket } from "@/lib/socket";
import { Loader2, MessageSquare } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

type MessageWithUser = Message & {
  user: User;
};

export function ChatMessages({ chatId }: { chatId: number }) {
  const { user: currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/chats", chatId, "messages"],
    queryFn: async () => {
      console.log(`Fetching messages for chat ${chatId}`);
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      console.log(`Received ${data.length} messages for chat ${chatId}`, data);
      return data;
    },
    enabled: !!chatId,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    socket.emit("join-chat", chatId.toString());
    console.log(`Joined chat room: ${chatId}`);

    socket.on("new-message", (newMessage: MessageWithUser) => {
      if (newMessage.chatId === chatId) {
        console.log('Received new message:', newMessage);
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
      console.log(`Leaving chat room: ${chatId}`);
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
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <ScrollArea className="h-[calc(100vh-8rem)] px-4">
      <div className="space-y-6">
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
                <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                  {date}
                </span>
              </div>
              {dateMessages.map((message) => {
                const isOwnMessage = message.userId === currentUser?.id;
                if (!message.user) {
                  console.error('Message without user data:', message);
                  return null;
                }
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} items-end gap-2`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-accent rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(message.createdAt), "p")}
                      </p>
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