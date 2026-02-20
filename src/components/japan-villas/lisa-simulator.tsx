"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Bot, User } from "lucide-react";

interface Property {
  beds24Id: string;
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  airbnbUrl?: string;
}

// Simulator messages - completely separate from real guest messages
interface TestMessage {
  id: string;
  role: "guest" | "lisa";
  content: string;
  timestamp: number;
  property?: string;
  guestName?: string;
}

interface LisaSimulatorProps {
  properties: Property[];
  loading: boolean;
}

const SAMPLE_MESSAGES = [
  {
    id: "checkin-early",
    label: "Early check-in request",
    content: "Hi! Our flight arrived early. Is it possible to check in before 3pm? We're arriving around 1pm. Thank you!",
    guestName: "Sarah Johnson",
  },
  {
    id: "wifi-password",
    label: "WiFi password",
    content: "Hello, I can't find the WiFi password anywhere. Could you please let me know what it is?",
    guestName: "Michael Chen",
  },
  {
    id: "checkout-late",
    label: "Late checkout request",
    content: "Our flight is in the evening. Would it be possible to check out a bit later? Maybe around 1pm instead of 11am?",
    guestName: "David Kim",
  },
  {
    id: "problem-escalation",
    label: "Problem requiring escalation",
    content: "Hi, we're having some issues with the property. The heating isn't working properly and there seems to be a problem with the kitchen appliances. Can someone help us?",
    guestName: "Jennifer Roberts",
  },
  {
    id: "restaurant-rec",
    label: "Restaurant recommendation", 
    content: "We'd love some local restaurant recommendations for dinner tonight. We prefer Japanese food and something not too expensive. Thanks!",
    guestName: "Emma Williams",
  },
  {
    id: "refund-inquiry",
    label: "Billing/refund question",
    content: "Hello, I need to ask about a partial refund due to some changes in our travel plans. Who should I speak with about this?",
    guestName: "Robert Martinez",
  },
  {
    id: "japanese-inquiry",
    label: "Japanese inquiry",
    content: "チェックインの時間を少し早くできますか？14:30頃に到着予定です。よろしくお願いします。",
    guestName: "田中太郎",
  },
];

export function LisaSimulator({ properties, loading }: LisaSimulatorProps) {
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [guestName, setGuestName] = useState("Test Guest");
  const [conversation, setConversation] = useState<TestMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, isLoading]);

  const sendMessage = async (content: string, guest: string) => {
    if (!selectedProperty || !content.trim()) return;

    let property = properties.find(p => p.beds24Id === selectedProperty);
    
    // Fallback: try to find by index if beds24Id doesn't match
    if (!property && !isNaN(Number(selectedProperty))) {
      const index = Number(selectedProperty);
      property = properties[index];
    }
    
    // Final fallback: use first property
    if (!property && properties.length > 0) {
      property = properties[0];
    }
    
    if (!property) {
      alert('No properties available. Please check the settings.');
      return;
    }

    // Add guest message to conversation
    const guestMessage: TestMessage = {
      id: `guest-${Date.now()}`,
      role: "guest",
      content: content.trim(),
      timestamp: Date.now(),
      property: property.name,
      guestName: guest,
    };

    setConversation(prev => [...prev, guestMessage]);
    setIsLoading(true);

    try {
      // Send to Lisa via API
      const response = await fetch("/api/japan-villas/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content.trim(),
          guestName: guest,
          property: property.name,
          propertyDetails: property,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add Lisa's response to conversation
        const lisaMessage: TestMessage = {
          id: `lisa-${Date.now()}`,
          role: "lisa",
          content: result.response || "Message sent successfully! Lisa will respond in the Slack channel.",
          timestamp: Date.now(),
        };

        setConversation(prev => [...prev, lisaMessage]);
      } else {
        // Handle API error
        const errorMessage: TestMessage = {
          id: `error-${Date.now()}`,
          role: "lisa",
          content: "Sorry, there was an issue sending the test message. Please try again or check the console for details.",
          timestamp: Date.now(),
        };

        setConversation(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Failed to get Lisa's response:", error);
      
      // Add error message
      const errorMessage: TestMessage = {
        id: `error-${Date.now()}`,
        role: "lisa",
        content: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        timestamp: Date.now(),
      };

      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleMessage = async (sample: typeof SAMPLE_MESSAGES[0]) => {
    if (!selectedProperty) {
      alert('Please select a property first');
      return;
    }
    if (isLoading) return; // Prevent double-clicks
    await sendMessage(sample.content, sample.guestName);
  };

  const handleCustomMessage = async () => {
    if (!selectedProperty) {
      alert('Please select a property first');
      return;
    }
    if (!customMessage.trim() || isLoading) return;
    
    await sendMessage(customMessage, guestName);
    setCustomMessage("");
  };

  const clearConversation = () => {
    setConversation([]);
  };

  if (loading) {
    return (
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-10 animate-pulse rounded bg-muted" />
              <div className="h-32 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-80 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Compact Setup Bar */}
      <div className="flex gap-3 items-end mb-4">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Property</label>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">Choose a property...</option>
            {properties.map((property, index) => (
              <option key={property.beds24Id || index} value={property.beds24Id || index.toString()}>
                {property.name} ({property.location})
              </option>
            ))}
          </select>
        </div>
        <div className="w-48">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Guest Name</label>
          <Input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Test Guest"
            className="h-9"
          />
        </div>
      </div>

      {selectedProperty && (
        <div className="grid grid-cols-[280px_1fr] gap-4" style={{ height: "calc(100vh - 280px)" }}>
          {/* Left: Quick Scenarios */}
          <div className="space-y-2 overflow-y-auto pr-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick Scenarios</p>
            {SAMPLE_MESSAGES.map(sample => (
              <Button
                key={sample.id}
                variant="outline"
                size="sm"
                className="w-full h-auto p-3 text-left justify-start hover:bg-violet-50 hover:border-violet-200 dark:hover:bg-violet-950 dark:hover:border-violet-800"
                disabled={isLoading || !selectedProperty}
                onClick={() => handleSampleMessage(sample)}
              >
                <div>
                  <div className="font-medium text-xs">{sample.label}</div>
                  <div className="text-muted-foreground text-[11px] line-clamp-1 mt-0.5">
                    {sample.content.length > 60 ? `${sample.content.slice(0, 60)}...` : sample.content}
                  </div>
                </div>
              </Button>
            ))}
          </div>

          {/* Right: Chat Interface */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b py-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-9 w-9 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Lisa 💜</CardTitle>
                  <p className="text-xs text-muted-foreground">Villa Concierge • Testing Mode</p>
                </div>
              </div>
              {conversation.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearConversation}>
                  Clear
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
              {/* Chat Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-gray-900/50"
              >
              {conversation.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="text-muted-foreground">
                    <Bot className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Start a conversation with Lisa</p>
                    <p className="text-xs">Send a message to test her responses</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {conversation.map(message => (
                  <div key={message.id} className={`flex ${message.role === "guest" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] ${message.role === "guest" ? "order-2" : "order-1"}`}>
                      {/* Message header */}
                      <div className={`flex items-center gap-2 mb-1 text-xs text-muted-foreground ${
                        message.role === "guest" ? "justify-end" : "justify-start"
                      }`}>
                        <div className={`flex items-center gap-1 ${message.role === "guest" ? "flex-row-reverse" : "flex-row"}`}>
                          {message.role === "guest" ? (
                            <>
                              <span className="font-medium">{message.guestName}</span>
                              <User className="h-3 w-3 text-blue-500" />
                            </>
                          ) : (
                            <>
                              <Bot className="h-3 w-3 text-violet-500" />
                              <span className="font-medium text-violet-600">Lisa</span>
                            </>
                          )}
                        </div>
                        <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      {/* Message bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          message.role === "guest"
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                      
                      {/* Property badge */}
                      {message.property && message.role === "guest" && (
                        <div className="flex justify-end mt-1">
                          <Badge variant="outline" className="text-xs">
                            {message.property}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Lisa typing indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                        <Bot className="h-3 w-3 text-violet-500" />
                        <span className="font-medium text-violet-600">Lisa</span>
                        <span>typing...</span>
                      </div>
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

              {/* Chat Input - Fixed at bottom */}
              <div className="border-t bg-background p-3 shrink-0">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Type your message to Lisa..."
                      rows={1}
                      className="flex min-h-[40px] max-h-32 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!isLoading && customMessage.trim()) {
                            handleCustomMessage();
                          }
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleCustomMessage}
                    disabled={!customMessage.trim() || isLoading}
                    size="sm"
                    className="h-10 w-10 rounded-full bg-violet-600 hover:bg-violet-700 p-0"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}