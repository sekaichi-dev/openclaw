"use client";

import { useState, useEffect, useRef } from "react";
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversationMessages = messages
    .filter((msg) => msg.bookingRef === selectedConversation)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const conversationInfo = conversationMessages[0];

  // Latest pending inbound message — default reply target
  const latestPending = [...conversationMessages]
    .reverse()
    .find((m) => m.direction === "inbound" && m.status === "pending");
  const replyTarget = latestPending ?? [...conversationMessages].reverse().find((m) => m.direction === "inbound");

  // Auto-scroll to bottom when conversation changes or new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation, conversationMessages.length]);

  const handleSend = () => {
    if (!replyText.trim() || !replyTarget) return;
    onReply(replyTarget.id, replyText.trim());
    setReplyText("");
  };

  const handleQuickReply = (messageId: string, reply: string) => {
    onReply(messageId, reply);
  };

  const getInitials = (name: string) =>
    (name || "??").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":   return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "replied":   return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "escalated": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:          return "bg-muted text-muted-foreground";
    }
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch ((platform ?? "").toLowerCase()) {
      case 'airbnb': 
      case 'air bnb':
        return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
      case 'booking.com':
      case 'booking':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'expedia':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case 'vrbo':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800';
      case 'agoda':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      case 'hotels.com':
      case 'hotels':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch ((platform ?? "").toLowerCase()) {
      case 'airbnb': 
      case 'air bnb':
        return '🏠';
      case 'booking.com':
      case 'booking':
        return '📅';
      case 'expedia':
        return '✈️';
      case 'vrbo':
        return '🏡';
      case 'agoda':
        return '🏨';
      case 'hotels.com':
      case 'hotels':
        return '🏩';
      default:
        return '🌐';
    }
  };

  if (!selectedConversation) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-base font-medium mb-1">Select a conversation</p>
          <p className="text-sm">Choose a guest from the left to view messages</p>
        </div>
      </div>
    );
  }

  if (conversationMessages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No messages in this conversation</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-xs font-semibold">{getInitials(conversationInfo.guestName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-base">{conversationInfo.guestName}</span>
              <Badge className={`text-[10px] h-5 px-2 font-medium ${getStatusColor(conversationInfo.status)}`}>
                {conversationInfo.status}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              {conversationInfo.property} • #{conversationInfo.bookingRef}
            </div>
          </div>
        </div>
        
        {/* Platform Badge - VERY Prominent */}
        <div className="flex items-center justify-center">
          <Badge 
            variant="outline" 
            className={`text-base h-10 px-4 font-bold border-2 shadow-sm ${getPlatformBadgeColor(conversationInfo.platform)} uppercase tracking-wide`}
          >
            <span className="text-lg mr-2">{getPlatformIcon(conversationInfo.platform)}</span>
            {conversationInfo.platform}
          </Badge>
        </div>
      </div>

      {/* Messages — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
        {conversationMessages.map((message) => (
          <div key={message.id} className="space-y-2">
            {/* Bubble */}
            <div className={`flex ${message.direction === "inbound" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                message.direction === "inbound"
                  ? "bg-muted rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              }`}>
                <div className="flex items-center gap-1.5 mb-1 opacity-70">
                  {message.direction === "inbound"
                    ? <User className="h-2.5 w-2.5" />
                    : <Send className="h-2.5 w-2.5" />}
                  <span className="text-[10px]">
                    {message.direction === "inbound" ? message.guestName : "Host"} ·{" "}
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                  </span>
                  {message.isNew && (
                    <Badge className="h-3.5 text-[9px] px-1 bg-blue-500/20 text-blue-400 border-0">NEW</Badge>
                  )}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed break-words">{message.message}</p>
              </div>
            </div>

            {/* AI suggested reply + quick actions */}
            {message.status === "pending" && message.direction === "inbound" && (
              <div className="pl-2 space-y-2">
                {message.suggestedReply && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="h-3 w-3 text-primary/70" />
                      <span className="text-xs font-medium text-primary/80">Lisa's suggested reply</span>
                    </div>
                    <p className="text-xs text-foreground/80 mb-2 whitespace-pre-wrap break-words">{message.suggestedReply}</p>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-6 text-xs px-2.5"
                        onClick={() => handleQuickReply(message.id, message.suggestedReply!)}>
                        Send
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-xs px-2.5"
                        onClick={() => setReplyText(message.suggestedReply!)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2.5"
                    onClick={() => onLetLisaHandle(message.id)}>
                    <Bot className="h-3 w-3 mr-1" />Let Lisa Handle
                  </Button>
                  {onAIAssist && (
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2.5"
                      onClick={() => onAIAssist(message.id)}>
                      <Sparkles className="h-3 w-3 mr-1" />AI Assist
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply box — always visible */}
      <div className="shrink-0 border-t bg-background px-4 py-3">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder={replyTarget ? `Reply to ${conversationInfo.guestName}…` : "No pending messages"}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={!replyTarget}
            rows={2}
            className="flex-1 resize-none text-sm min-h-[60px] max-h-[120px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!replyText.trim() || !replyTarget}
            size="sm"
            className="h-[60px] px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
