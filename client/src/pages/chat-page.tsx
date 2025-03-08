import { useState } from "react";
import { Chat } from "@shared/schema";
import { ChatList } from "@/components/chat/chat-list";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  return (
    <div className="flex h-screen">
      <div className="w-80 flex-shrink-0">
        <ChatList onSelectChat={setSelectedChat} />
      </div>
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          <ChatMessages chatId={selectedChat.id} />
          <ChatInput chatId={selectedChat.id} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a chat to start messaging
        </div>
      )}
    </div>
  );
}
