"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Message {
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
  suggestedReply?: string;
}

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  replied: {
    label: "Replied",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  escalated: {
    label: "Escalated",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

const platformColors: Record<string, string> = {
  Airbnb: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "Booking.com": "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

interface MessageCardProps {
  message: Message;
  onReply: (messageId: string, reply: string) => void;
  onLetLisaHandle: (messageId: string) => void;
  onAIAssist?: (messageId: string) => void;
}

export function MessageCard({
  message,
  onReply,
  onLetLisaHandle,
  onAIAssist,
}: MessageCardProps) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [aiAssisting, setAiAssisting] = useState(false);

  // Initialize with Lisa's suggested reply if available
  useEffect(() => {
    if (message.suggestedReply && !replyText) {
      setReplyText(message.suggestedReply);
    }
  }, [message.suggestedReply, replyText]);

  const status = statusConfig[message.status];
  const platformClass =
    platformColors[message.platform] ||
    "bg-muted text-muted-foreground border-border";

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await onReply(message.id, replyText);
    setReplyText("");
    setSending(false);
  };

  const handleAIAssist = async () => {
    if (!onAIAssist) return;
    setAiAssisting(true);
    await onAIAssist(message.id);
    setAiAssisting(false);
  };

  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">
                {message.guestName}
              </span>
              <Badge
                variant="outline"
                className={cn("px-1.5 py-0 text-[10px]", platformClass)}
              >
                {message.platform}
              </Badge>
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                {message.property}
              </Badge>
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {timeAgo(message.timestamp)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              {message.message}
            </p>
            <div className="mt-1 text-xs text-muted-foreground">
              Ref: {message.bookingRef}
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0 text-[10px]", status.className)}
          >
            {status.label}
          </Badge>
        </div>

        {message.reply && (
          <div className="mt-3 ml-4 rounded-lg border border-border/50 bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Bot className="h-3 w-3 text-violet-400" />
              <span>Reply sent</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">
              {message.reply}
            </p>
          </div>
        )}

        {message.status === "pending" && (
          <div className="mt-3 space-y-2">
            {message.suggestedReply && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Bot className="h-3 w-3 text-violet-400" />
                  <span>Lisa's suggested reply:</span>
                </div>
                <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-3">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {message.suggestedReply}
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={message.suggestedReply ? "Edit the reply above or write your own..." : "Type a reply..."}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
              />
              <Button
                size="sm"
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
              >
                <Send className="h-3.5 w-3.5" />
                Reply
              </Button>
              {onAIAssist && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAIAssist}
                  disabled={aiAssisting}
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Assist
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLetLisaHandle(message.id)}
                className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
              >
                <Bot className="h-3.5 w-3.5" />
                Let Lisa Handle
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
