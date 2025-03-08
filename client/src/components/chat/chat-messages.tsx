import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Message, type User } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { socket } from "@/lib/socket";
import { Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

type MessageWithUser = Message & {
  user: User;
};

export function ChatMessages({ chatId }: { chatId: number }) {
  const { user: currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/chats", chatId, "messages"],
    enabled: !!chatId,
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

  return (
    <ScrollArea className="h-[calc(100vh-8rem)] px-4">
      <div className="space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.userId === currentUser?.id;
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isOwnMessage
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm font-medium mb-1">
                  {message.user.username}
                </p>
                <p className="text-sm break-words">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {format(new Date(message.createdAt), "p")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}