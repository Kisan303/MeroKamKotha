import { useState, useEffect } from "react";
import { Chat, User } from "@shared/schema";
import { ChatList } from "@/components/chat/chat-list";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatHeader } from "@/components/chat/chat-header";
import { useAuth } from "@/hooks/use-auth";
import { socket } from "@/lib/socket";
import { useTour } from "@/hooks/use-tour";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const { user: currentUser } = useAuth();
  const { startTour } = useTour();

  // Find the other participant in the selected chat
  const chatParticipant = selectedChat?.participants?.find(
    (p: User) => p.id !== currentUser?.id
  );

  useEffect(() => {
    // Start the tour when the chat page is first visited
    startTour('/chat');
  }, []);

  // Handle current user's online status and track other users' status
  useEffect(() => {
    if (!currentUser) return;

    // Reconnect socket if needed
    if (!socket.connected) {
      socket.connect();
    }

    // Emit online status when component mounts
    socket.emit("user-online", currentUser.id);

    // Handle initial online users
    socket.on("initial-online-users", (users: number[]) => {
      setOnlineUsers(new Set(users));
    });

    // Listen for user status changes
    const handleStatusChange = (data: { userId: number; status: 'online' | 'offline' }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };

    socket.on("user-status-change", handleStatusChange);

    // Handle cleanup on unmount
    return () => {
      socket.off("user-status-change", handleStatusChange);
      socket.off("initial-online-users");
    };
  }, [currentUser]);

  return (
    <div className="flex h-screen bg-background">
      {/* Chat List - Hidden on mobile when chat is selected */}
      <div className={`${
        selectedChat && !showMobileList ? 'hidden' : 'block'
      } md:block w-full md:w-80 flex-shrink-0 border-r chat-list`}>
        <ChatList 
          onSelectChat={(chat) => {
            setSelectedChat(chat);
            setShowMobileList(false);
          }}
          selectedChatId={selectedChat?.id}
          onlineUsers={onlineUsers}
        />
      </div>

      {/* Chat Area - Hidden on mobile when showing chat list */}
      <div className={`${
        showMobileList ? 'hidden' : 'block'
      } md:block flex-1 flex flex-col chat-messages`}>
        {selectedChat ? (
          <>
            <ChatHeader 
              participant={chatParticipant}
              onBack={() => setShowMobileList(true)}
              isOnline={chatParticipant ? onlineUsers.has(chatParticipant.id) : false}
            />
            <ChatMessages chatId={selectedChat.id} />
            <ChatInput chatId={selectedChat.id} className="chat-input" />
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