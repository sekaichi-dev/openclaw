"use client";

import { useState, useEffect } from "react";
import { Home, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePolling } from "@/hooks/use-polling";
import { MessageList } from "@/components/japan-villas/message-list";
import { ConversationList } from "@/components/japan-villas/conversation-list";
import { MessageThread } from "@/components/japan-villas/message-thread";
import {
  ToneSettings,
  type ConciergeSettings,
} from "@/components/japan-villas/tone-settings";
import { PropertyCard } from "@/components/japan-villas/property-card";
import {
  LisaStatus,
  type LisaStatusData,
} from "@/components/japan-villas/lisa-status";
import { LisaSimulator } from "@/components/japan-villas/lisa-simulator";
import type { Message } from "@/components/japan-villas/message-card";

export default function JapanVillasPage() {
  const [autoRespond, setAutoRespond] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const {
    data: messages,
    loading: messagesLoading,
    refetch: refetchMessages,
  } = usePolling<Message[]>("/api/japan-villas/messages", 60000, [], {
    priority: "normal",
    adaptiveInterval: true
  });

  // Update last updated timestamp when messages change
  useEffect(() => {
    if (messages) {
      setLastUpdated(new Date());
    }
  }, [messages]);

  const { data: settings, loading: settingsLoading } =
    usePolling<ConciergeSettings>("/api/japan-villas/settings", 60000);

  const { data: lisaStatus } = usePolling<LisaStatusData>(
    "/api/japan-villas/lisa",
    10000
  );

  const handleReply = async (messageId: string, reply: string) => {
    await fetch("/api/japan-villas/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, reply }),
    });
    await refetchMessages();
  };

  const handleLetLisaHandle = async (messageId: string) => {
    await fetch("/api/japan-villas/lisa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", messageId }),
    });
    await refetchMessages();
  };

  const handleAIAssist = async (messageId: string) => {
    await fetch("/api/japan-villas/ai-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });
    await refetchMessages();
  };

  const handleSaveSettings = async (updated: ConciergeSettings) => {
    await fetch("/api/japan-villas/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Home className="h-6 w-6" />
            Japan Villas
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Guest messaging &amp; concierge management
          </p>
        </div>
        <LisaStatus
          status={lisaStatus}
          autoRespond={autoRespond}
          onToggleAutoRespond={setAutoRespond}
        />
      </div>

      <Tabs defaultValue="messages">
        <TabsList variant="line">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="simulator">Test Lisa</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium">Guest Conversations</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {messagesLoading ? (
                  <WifiOff className="h-3 w-3 text-yellow-500" />
                ) : (
                  <Wifi className="h-3 w-3 text-green-500" />
                )}
                <span>Live from Beds24</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetchMessages()}
                disabled={messagesLoading}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary rounded-md hover:bg-secondary/80 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${messagesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Auto-refresh: 1m</p>
                {lastUpdated && (
                  <p>Updated: {lastUpdated.toLocaleTimeString()}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-300px)]">
            {/* Left: Conversation List */}
            <div className="col-span-4 border rounded-lg">
              <ConversationList
                messages={messages || []}
                loading={messagesLoading}
                properties={settings?.properties || []}
                selectedConversation={selectedConversation}
                onSelectConversation={setSelectedConversation}
              />
            </div>
            
            {/* Right: Message Thread */}
            <div className="col-span-8 border rounded-lg">
              <MessageThread
                messages={messages || []}
                selectedConversation={selectedConversation}
                onReply={handleReply}
                onLetLisaHandle={handleLetLisaHandle}
                onAIAssist={handleAIAssist}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Concierge Settings</h3>
            <ToneSettings
              settings={settings}
              loading={settingsLoading}
              onSave={handleSaveSettings}
            />
          </div>
        </TabsContent>

        <TabsContent value="properties">
          {settingsLoading ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(settings?.properties || []).map((property) => (
                <PropertyCard key={property.beds24Id} property={property} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="simulator">
          <LisaSimulator 
            properties={settings?.properties || []}
            loading={settingsLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
