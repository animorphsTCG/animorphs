import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth/AuthProvider";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
}

interface BattleChatProps {
  disabled?: boolean;
  disabledMessage?: string;
}

const BattleChat: React.FC<BattleChatProps> = ({ 
  disabled = false,
  disabledMessage = "Chat is disabled during this phase."
}) => {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-1",
      sender: "System",
      text: "Welcome to the battle chat! Be respectful and have fun.",
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  
  const getUsername = () => {
    if (userProfile?.username) {
      return userProfile.username;
    }
    
    if (user?.email) {
      return user.email.split('@')[0];
    }
    
    return 'Guest';
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      sender: getUsername(),
      text: newMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex flex-col h-[400px] border border-gray-800 rounded-md bg-black/40">
      <div className="p-2 border-b border-gray-800 bg-gray-900/50">
        <h3 className="text-sm font-medium">Battle Chat</h3>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        {disabled ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-center">{disabledMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`p-2 rounded ${
                  message.sender === "System" 
                    ? "bg-gray-800/50" 
                    : message.sender === getUsername() 
                      ? "bg-fantasy-primary/20" 
                      : "bg-gray-700/20"
                }`}
              >
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="font-medium">
                    {message.sender === getUsername() ? "You" : message.sender}
                  </span>
                  <span>{formatTime(message.timestamp)}</span>
                </div>
                <p className="text-sm mt-1">{message.text}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className="p-2 border-t border-gray-800">
        <div className="flex gap-2">
          <Input 
            placeholder={disabled ? "Chat disabled" : "Type a message..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={disabled}
            className="bg-gray-900/30"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={disabled || !newMessage.trim()}
            variant="outline"
            size="sm"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BattleChat;
