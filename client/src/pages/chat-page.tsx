import { useState, useEffect } from "react";
import { Chat, User } from "@shared/schema";
import { ChatList } from "@/components/chat/chat-list";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatHeader } from "@/components/chat/chat-header";
import { useAuth } from "@/hooks/use-auth";
import { socket } from "@/lib/socket";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const { user: currentUser } = useAuth();

  // Find the other participant in the selected chat
  const chatParticipant = selectedChat?.participants?.find(
    (p: User) => p.id !== currentUser?.id
  );

  // Handle current user's online status
  useEffect(() => {
    if (!currentUser) return;

    // Emit online status when component mounts
    socket.emit("user-online", currentUser.id);

    // Handle cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  return (
    <div className="flex h-screen bg-background">
      {/* Chat List - Hidden on mobile when chat is selected */}
      <div className={`${
        selectedChat && !showMobileList ? 'hidden' : 'block'
      } md:block w-full md:w-80 flex-shrink-0 border-r`}>
        <ChatList 
          onSelectChat={(chat) => {
            setSelectedChat(chat);
            setShowMobileList(false);
          }}
          selectedChatId={selectedChat?.id}
        />
      </div>

      {/* Chat Area - Hidden on mobile when showing chat list */}
      <div className={`${
        showMobileList ? 'hidden' : 'block'
      } md:block flex-1 flex flex-col`}>
        {selectedChat ? (
          <>
            <ChatHeader 
              participant={chatParticipant}
              onBack={() => setShowMobileList(true)}
            />
            <ChatMessages chatId={selectedChat.id} />
            <ChatInput chatId={selectedChat.id} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg">Select a chat to start messaging</p>
              <p className="text-sm">Or click on a user's profile to start a new conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}