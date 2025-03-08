import { useState } from "react";
import { Chat } from "@shared/schema";
import { ChatList } from "@/components/chat/chat-list";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  return (
    <div className="flex h-screen bg-background">
      <div className="w-80 flex-shrink-0 border-r">
        <ChatList 
          onSelectChat={setSelectedChat} 
          selectedChatId={selectedChat?.id}
        />
      </div>
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          <ChatMessages chatId={selectedChat.id} />
          <ChatInput chatId={selectedChat.id} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg">Select a chat to start messaging</p>
            <p className="text-sm">Or click on a user's profile to start a new conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}