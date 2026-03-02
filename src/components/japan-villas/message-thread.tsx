"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, Sparkles, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  guestName: string;
  property: string;
  platform: string;
  message: string;
  timestamp: string;
  direction: string;
  status: string;
  bookingRef: string;
  suggestedReply?: string;
  isNew?: boolean;
}

interface MessageThreadProps {
  messages: Message[];
  selectedConversation: string | null;
  onReply: (messageId: string, reply: string) => void;
  onLetLisaHandle: (messageId: string) => void;
  onAIAssist?: (messageId: string) => void;
}

export function MessageThread({
  messages,
  selectedConversation,
  onReply,
  onLetLisaHandle,
  onAIAssist,
}: MessageThreadProps) {
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Filter messages for selected conversation and sort chronologically
  const conversationMessages = messages
    .filter(msg => msg.bookingRef === selectedConversation)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const conversationInfo = conversationMessages[0];

  const handleSendReply = () => {
    if (!replyText.trim() || !replyingTo) return;
    
    onReply(replyingTo, replyText);
    setReplyText("");
    setReplyingTo(null);
  };

  const handleQuickReply = (messageId: string, reply: string) => {
    onReply(messageId, reply);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMessageTypeIcon = (direction: string) => {
    return direction === 'inbound' ? <User className="h-3 w-3" /> : <Send className="h-3 w-3" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!selectedConversation) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Select a conversation</div>
          <div className="text-sm">Choose a guest conversation from the left to view messages</div>
        </div>
      </div>
    );
  }

  if (conversationMessages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No messages found</div>
          <div className="text-sm">This conversation appears to be empty</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-sm">
              {getInitials(conversationInfo.guestName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">{conversationInfo.guestName}</h3>
              <Badge className={`text-xs ${getStatusColor(conversationInfo.status)}`}>
                {conversationInfo.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {conversationInfo.property} • {conversationInfo.platform} • #{conversationInfo.bookingRef}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {conversationMessages.map((message) => (
            <div key={message.id} className="space-y-3">
              {/* Message Bubble */}
              <div className={`flex ${message.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  message.direction === 'inbound' 
                    ? 'bg-muted' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getMessageTypeIcon(message.direction)}
                    <span className="text-xs font-medium">
                      {message.direction === 'inbound' ? message.guestName : 'Host'}
                    </span>
                    <span className="text-xs opacity-70">
                      {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    </span>
                    {message.isNew && (
                      <Badge className="h-4 text-xs bg-blue-100 text-blue-800">NEW</Badge>
                    )}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                </div>
              </div>

              {/* Action Buttons for Pending Messages */}
              {message.status === 'pending' && message.direction === 'inbound' && (
                <div className="space-y-3">
                  {/* Suggested Reply */}
                  {message.suggestedReply && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700">AI Suggested Reply</span>
                      </div>
                      <div className="text-sm text-blue-800 mb-3">{message.suggestedReply}</div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleQuickReply(message.id, message.suggestedReply!)}
                          className="h-7 px-3 text-xs"
                        >
                          Send This
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReplyingTo(message.id)}
                          className="h-7 px-3 text-xs"
                        >
                          Edit & Send
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReplyingTo(message.id)}
                      className="h-8 px-3 text-xs"
                    >
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onLetLisaHandle(message.id)}
                      className="h-8 px-3 text-xs"
                    >
                      <Bot className="h-3 w-3 mr-1" />
                      Let Lisa Handle
                    </Button>
                    {onAIAssist && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAIAssist(message.id)}
                        className="h-8 px-3 text-xs"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Assist
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Reply Box */}
      {replyingTo && (
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Replying to {conversationInfo.guestName}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyingTo(null)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              ×
            </Button>
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      )}
    </div>
  );
}