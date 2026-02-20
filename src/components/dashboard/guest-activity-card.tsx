"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, MessageCircle, ExternalLink } from "lucide-react";
import { usePolling } from "@/hooks/use-polling";
import Link from "next/link";

interface Message {
  id: string;
  guestName: string;
  property: string;
  platform: string;
  message: string;
  timestamp: string;
  direction: "inbound" | "outbound";
  status: "pending" | "replied" | "escalated";
  bookingRef: string;
  reply?: string;
}

export function GuestActivityCard({ className }: { className?: string }) {
  const { data: messages, loading } = usePolling<Message[]>("/api/japan-villas/messages", 30000, []);

  if (loading || !messages) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <Home className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Guest Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get recent messages (last 24h, sorted by timestamp desc)
  const recentMessages = messages
    .filter((msg) => {
      const msgTime = new Date(msg.timestamp);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return msgTime >= oneDayAgo;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const pendingCount = recentMessages.filter(msg => msg.status === "pending").length;
  const recentGuestMessages = recentMessages.filter(msg => msg.direction === "inbound");

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "replied":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "escalated":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-muted-foreground/20 text-muted-foreground";
    }
  };

  const getPropertyShort = (property: string) => {
    if (property.includes("LAKE HOUSE")) return "Lake House";
    if (property.includes("MOUNTAIN VILLA")) return "Mountain Villa";
    if (property.includes("Lake Side")) return "Lake Side INN";
    return property.substring(0, 12);
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Guest Activity</CardTitle>
          {pendingCount > 0 && (
            <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              {pendingCount} pending
            </Badge>
          )}
        </div>
        <Link href="/japan-villas">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            <ExternalLink className="h-3 w-3 mr-1" />
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {recentGuestMessages.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No guest messages in the last 24h.
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {recentGuestMessages.map((message) => (
                <div
                  key={message.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{message.guestName}</span>
                      <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(message.status)}`}>
                        {message.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(message.timestamp)}
                    </span>
                  </div>

                  {/* Property and platform info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{getPropertyShort(message.property)}</span>
                    <span>•</span>
                    <span>{message.platform}</span>
                    <span>•</span>
                    <span className="font-mono">{message.bookingRef}</span>
                  </div>

                  {/* Message preview */}
                  <p className="text-xs leading-relaxed text-foreground/90 overflow-hidden" style={{ 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical' 
                  }}>
                    {message.message}
                  </p>

                  {/* Reply preview if exists */}
                  {message.reply && (
                    <div className="text-xs text-muted-foreground border-l-2 border-emerald-500/30 pl-3 mt-1">
                      <span className="text-emerald-400">Lisa:</span> {message.reply.substring(0, 80)}{message.reply.length > 80 && "..."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}