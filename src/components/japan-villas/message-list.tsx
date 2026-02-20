"use client";

import { useState } from "react";
import { MessageCard, type Message } from "./message-card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Property {
  name: string;
}

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  properties: Property[];
  onReply: (messageId: string, reply: string) => void;
  onLetLisaHandle: (messageId: string) => void;
  onAIAssist?: (messageId: string) => void;
}

export function MessageList({
  messages,
  loading,
  properties,
  onReply,
  onLetLisaHandle,
  onAIAssist,
}: MessageListProps) {
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");

  const filtered = messages.filter((m) => {
    if (propertyFilter !== "all" && m.property !== propertyFilter) return false;
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-3">
        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="h-8 rounded-md border border-input bg-input/30 px-2 text-sm text-foreground outline-none"
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
          className="h-8 rounded-md border border-input bg-input/30 px-2 text-sm text-foreground outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="replied">Replied</option>
          <option value="escalated">Escalated</option>
        </select>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No messages found
          </div>
        ) : (
          <div className="space-y-3 pr-4">
            {filtered.map((msg) => (
              <MessageCard
                key={msg.id}
                message={msg}
                onReply={onReply}
                onLetLisaHandle={onLetLisaHandle}
                onAIAssist={onAIAssist}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
