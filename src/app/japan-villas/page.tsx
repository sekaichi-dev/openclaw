"use client";

import { useState } from "react";
import { Home } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePolling } from "@/hooks/use-polling";
import { MessageList } from "@/components/japan-villas/message-list";
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

  const {
    data: messages,
    loading: messagesLoading,
    refetch: refetchMessages,
  } = usePolling<Message[]>("/api/japan-villas/messages", 15000, []);

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
          <TabsTrigger value="messages">Messages &amp; Settings</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="simulator">Test Lisa</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Guest Messages</h3>
                <p className="text-sm text-muted-foreground">Real Airbnb & Booking.com messages only</p>
              </div>
              <MessageList
                messages={messages || []}
                loading={messagesLoading}
                properties={settings?.properties || []}
                onReply={handleReply}
                onLetLisaHandle={handleLetLisaHandle}
                onAIAssist={handleAIAssist}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Tone &amp; Settings</h3>
              <ToneSettings
                settings={settings}
                loading={settingsLoading}
                onSave={handleSaveSettings}
              />
            </div>
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
