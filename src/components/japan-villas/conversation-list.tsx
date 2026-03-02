"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  isNew?: boolean;
}

interface Property {
  name: string;
}

interface Conversation {
  bookingRef: string;
  guestName: string;
  property: string;
  platform: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'pending' | 'replied' | 'escalated';
  messages: Message[];
}

interface ConversationListProps {
  messages: Message[];
  loading: boolean;
  properties: Property[];
  selectedConversation: string | null;
  onSelectConversation: (bookingRef: string) => void;
}

export function ConversationList({
  messages,
  loading,
  properties,
  selectedConversation,
  onSelectConversation,
}: ConversationListProps) {
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Group messages by booking reference to create conversations
  const conversations = messages.reduce((acc, message) => {
    const key = message.bookingRef;
    if (!acc[key]) {
      acc[key] = {
        bookingRef: message.bookingRef,
        guestName: message.guestName,
        property: message.property,
        platform: message.platform,
        lastMessage: message.message,
        lastMessageTime: message.timestamp,
        unreadCount: 0,
        status: message.status as 'pending' | 'replied' | 'escalated',
        messages: [],
      };
    }
    
    // Update with latest message info
    const msgTime = new Date(message.timestamp);
    const lastTime = new Date(acc[key].lastMessageTime);
    if (msgTime > lastTime) {
      acc[key].lastMessage = message.message;
      acc[key].lastMessageTime = message.timestamp;
    }
    
    // Count unread messages (pending status)
    if (message.status === 'pending') {
      acc[key].unreadCount++;
    }
    
    // Update overall conversation status (pending takes priority)
    if (message.status === 'pending') {
      acc[key].status = 'pending';
    }
    
    acc[key].messages.push(message);
    return acc;
  }, {} as Record<string, Conversation>);

  // Convert to array and sort by latest message time
  const conversationList = Object.values(conversations)
    .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

  // Apply filters
  const filtered = conversationList.filter((conversation) => {
    if (propertyFilter !== "all" && conversation.property !== propertyFilter) return false;
    if (statusFilter !== "all" && conversation.status !== statusFilter) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const truncateMessage = (message: string, length = 60) => {
    if (message.length <= length) return message;
    return message.slice(0, length) + '...';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="p-3 border-b space-y-2">
        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="all">All Properties</option>
          {properties.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="replied">Replied</option>
          <option value="escalated">Escalated</option>
        </select>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No conversations found
          </div>
        ) : (
          <div className="p-2">
            {filtered.map((conversation) => (
              <div
                key={conversation.bookingRef}
                onClick={() => onSelectConversation(conversation.bookingRef)}
                className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 mb-2 ${
                  selectedConversation === conversation.bookingRef 
                    ? 'bg-primary/10 border-primary/20 border' 
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(conversation.guestName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {conversation.guestName}
                      </h4>
                      <div className="flex items-center gap-1">
                        {conversation.unreadCount > 0 && (
                          <Badge variant="secondary" className="h-5 min-w-5 text-xs px-1.5">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                        <Badge className={`text-xs h-5 ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-1">
                      {conversation.property} • {conversation.platform}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {truncateMessage(conversation.lastMessage)}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        #{conversation.bookingRef}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}