import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Search, MoreVertical, ArrowLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { socket } from "@/lib/socket";

interface ChatHeaderProps {
  participant?: User;
  onBack?: () => void;
}

export function ChatHeader({ participant, onBack }: ChatHeaderProps) {
  const [, navigate] = useLocation();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!participant) return;

    // Listen for user status changes
    const handleStatusChange = (data: { userId: number; status: 'online' | 'offline' }) => {
      if (data.userId === participant.id) {
        setIsOnline(data.status === 'online');
      }
    };

    socket.on("user-status-change", handleStatusChange);

    return () => {
      socket.off("user-status-change", handleStatusChange);
    };
  }, [participant]);

  if (!participant) return null;

  return (
    <div className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center px-4 sticky top-0 z-10">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* User Avatar with Online Status */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">
              {participant.username.slice(0, 2).toUpperCase()}
            </span>
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-medium truncate">
            {participant.fullname || participant.username}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/')}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Clear Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}