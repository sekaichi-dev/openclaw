import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

// Property mapping for Beds24 property IDs
const PROPERTY_MAPPING: Record<number, string> = {
  265980: "LAKE HOUSE 野尻湖",
  265981: "MOUNTAIN VILLA ニセコ", 
  281224: "The Lake Side INN"
};

interface Beds24Message {
  id: number;
  authorOwnerId: number | null;
  bookingId: number;
  roomId: number;
  propertyId: number;
  message: string;
  time: string;
  source: string;
  read: boolean;
}

interface Beds24Booking {
  bookingId: number;
  propId?: number;
  propertyId?: number;
  guestFirstName?: string;
  guestName?: string;
  guestSurname?: string;
  referer?: string;
  refererEditable?: string;
  channel?: string;
  apiSource?: string;
}

function detectPlatform(booking: Beds24Booking): string {
  // Use the most reliable fields first, all case-insensitive
  const sources = [
    booking.channel,
    booking.apiSource,
    booking.referer,
    booking.refererEditable,
  ].map((s) => (s ?? "").toLowerCase());

  if (sources.some((s) => s.includes("airbnb")))       return "Airbnb";
  if (sources.some((s) => s.includes("booking")))      return "Booking.com";
  if (sources.some((s) => s.includes("expedia")))      return "Expedia";
  if (sources.some((s) => s.includes("vrbo")))         return "VRBO";
  if (sources.some((s) => s.includes("agoda")))        return "Agoda";
  if (sources.some((s) => s.includes("hotels")))       return "Hotels.com";
  if (sources.some((s) => s.includes("tripadvisor")))  return "TripAdvisor";
  if (sources.some((s) => s.includes("direct") || s.includes("website") || s === "")) return "Direct";
  // Return the raw apiSource/referer capitalised if nothing matched
  const raw = booking.apiSource || booking.referer || booking.channel || "";
  return raw.charAt(0).toUpperCase() + raw.slice(1) || "Direct";
}

const LISA_VILLAS_PATH = '/Users/sekaichi/.openclaw/agents/lisa/japan-villas';

async function getConciergeState() {
  // Try Lisa's agent path first, fall back to workspace
  const paths = [
    join(LISA_VILLAS_PATH, 'concierge-state.json'),
    join(process.env.OPENCLAW_WORKSPACE || '/Users/sekaichi/.openclaw/workspace', 'japan-villas', 'concierge-state.json'),
  ];
  for (const p of paths) {
    try {
      const state = JSON.parse(await readFile(p, 'utf-8'));
      return { lastCheckedMessageId: state.lastCheckedMessageId || 0, processedMessageIds: state.processedMessageIds || [] };
    } catch {}
  }
  return { lastCheckedMessageId: 0, processedMessageIds: [] };
}

async function getDraftedReplies(): Promise<Record<string, { draft: string; guestName?: string; property?: string; createdAt?: string }>> {
  try {
    const raw = await readFile(join(LISA_VILLAS_PATH, 'drafted-replies.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function fetchBeds24Messages(): Promise<any[]> {
  try {
    const token = process.env.BEDS24_API_TOKEN;
    if (!token || token === 'your_beds24_token_here') {
      console.warn('Beds24 API token not configured');
      return [];
    }

    // Get concierge state and Lisa's drafted replies
    const conciergeState = await getConciergeState();
    const draftedReplies = await getDraftedReplies();

    // Fetch messages
    const messagesResponse = await fetch('https://api.beds24.com/v2/bookings/messages?limit=200', {
      headers: {
        'token': token
      }
    });

    if (!messagesResponse.ok) {
      throw new Error(`Beds24 API error: ${messagesResponse.status}`);
    }

    const rawMessages = await messagesResponse.json();
    
    // Handle Beds24 API response structure
    let messages: Beds24Message[] = [];
    if (rawMessages && Array.isArray(rawMessages.data)) {
      messages = rawMessages.data;
    } else if (Array.isArray(rawMessages)) {
      messages = rawMessages;
    } else {
      console.warn('Unexpected Beds24 API response structure:', rawMessages);
      throw new Error('Invalid API response structure');
    }
    
    // Include both guest and host messages for full conversation history
    const allMessages = messages;

    // Batch-fetch all unique bookings in ONE request to avoid rate limits
    const uniqueBookingIds = [...new Set(allMessages.map((m) => m.bookingId))];
    const bookingMap: Record<number, Beds24Booking> = {};

    try {
      const bookingResponse = await fetch(
        `https://api.beds24.com/v2/bookings?ids=${uniqueBookingIds.join(',')}`,
        { headers: { token } }
      );
      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json();
        const bookings: Beds24Booking[] = Array.isArray(bookingData)
          ? bookingData
          : (bookingData?.data ?? []);
        for (const b of bookings) {
          const bid = (b as any).id ?? (b as any).bookingId;
          if (bid) bookingMap[bid] = b;
        }
      }
    } catch (err) {
      console.warn('Batch booking fetch failed:', err);
    }

    const enrichedMessages = allMessages.map((message) => {
      const booking = bookingMap[message.bookingId];
      const propertyId = (message.propertyId || booking?.propertyId || (booking as any)?.propId) as number;
      const propertyName = PROPERTY_MAPPING[propertyId] || `Property ${propertyId}`;
      const platform = booking ? detectPlatform(booking) : 'Unknown';
      const isProcessed = conciergeState.processedMessageIds.includes(message.id);
      const isNew = message.id > conciergeState.lastCheckedMessageId;

      const rawName = booking
        ? (booking.guestName || `${booking.guestFirstName ?? ''} ${booking.guestSurname ?? ''}`.trim() || null)
        : null;
      const guestName = rawName || 'Guest';

      return {
        id: `beds24-${message.id}`,
        guestName,
        property: propertyName,
        platform,
        message: message.message,
        timestamp: message.time,
        direction: message.source === 'guest' ? 'inbound' : 'outbound',
        status: message.source === 'guest' ? (isProcessed ? 'replied' : 'pending') : 'replied',
        bookingRef: `${message.bookingId}`,
        suggestedReply: message.source === 'guest' ? (draftedReplies[String(message.id)]?.draft ?? undefined) : undefined,
        isNew: message.source === 'guest' && isNew && !isProcessed,
      };
    });

    // Sort by timestamp, newest first
    return enrichedMessages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  } catch (error) {
    console.error('Error fetching Beds24 messages:', error);
    return [];
  }
}

function getMockMessages() {
  return [
    {
      id: "msg-001",
      guestName: "田中太郎",
      property: "LAKE HOUSE 野尻湖",
      platform: "Airbnb",
      message: "チェックインの時間を30分早められますか？15:00前に到着予定です。",
      timestamp: "2026-02-20T14:30:00Z",
      direction: "inbound",
      status: "pending",
      bookingRef: "HMA8XXXXX",
      suggestedReply: `田中様、お疲れ様です。15:00のアーリーチェックインは可能です。清掃が14:30頃に完了予定ですので、15:00にお越しください。鍵はキーボックス（コード${process.env.LAKEHOUSE_KEYBOX_CODE || "XXXX"}）からお取りいただけます。ご到着をお待ちしております！`,
    },
    {
      id: "msg-002", 
    },
    {
      id: "msg-002-reply",
      guestName: "Sarah Johnson",
      property: "MOUNTAIN VILLA ニセコ",
      platform: "Airbnb",
      message: "Hello Sarah! There's an excellent supermarket called MaxValu about 10 minutes from the villa. I'd recommend stopping there on your way. They have a great selection including local Hokkaido specialties. Would you like me to send you the Google Maps link?",
      timestamp: "2026-02-20T13:20:00Z",
      direction: "outbound",
      status: "replied",
      bookingRef: "HMA8YYYYY",
    },
    {
      id: "msg-002-guest-thanks",
      guestName: "Sarah Johnson",
      property: "MOUNTAIN VILLA ニセコ",
      platform: "Airbnb",
      message: "Perfect! Yes please send the Google Maps link. Thank you so much for the quick response!",
      timestamp: "2026-02-20T13:25:00Z",
      direction: "inbound",
      status: "pending",
      bookingRef: "HMA8YYYYY",
      suggestedReply: "Here's the Google Maps link: https://maps.google.com/... Safe travels!",
    },
    {
      id: "msg-002-grocery",
      guestName: "Sarah Johnson",
      property: "MOUNTAIN VILLA ニセコ",
      platform: "Airbnb",
      message: "Hi! We're arriving tomorrow. Is there grocery delivery available or should we stop at a supermarket on the way?",
      timestamp: "2026-02-20T13:15:00Z",
      direction: "inbound",
      status: "replied",
      bookingRef: "HMA8YYYYY",
      reply: "Hello Sarah! Welcome! There's an excellent supermarket called MaxValu about 10 minutes from the villa. I'd recommend stopping there on your way. They have a great selection including local Hokkaido specialties. Would you like me to send you the Google Maps link?",
    },
    {
      id: "msg-003",
      guestName: "Michael Chen", 
      property: "The Lake Side INN",
      platform: "Booking.com",
      message: "What's the WiFi password? I can't find it in the guidebook.",
      timestamp: "2026-02-20T11:00:00Z",
      direction: "inbound",
      status: "pending",
      bookingRef: "BDC-12345",
      suggestedReply: `Hi Michael! The WiFi information for your cabin is: Network: "NojiriLake-1" Password: "${process.env.LAKESIDE_CABIN1_WIFI || "[REDACTED]"}" You'll find this network listed on your device. If you have any trouble connecting, please let me know! Enjoy your stay at The Lake Side INN. 🏞️`,
    }
  ];
}

export async function GET() {
  const [messages, draftedReplies] = await Promise.all([
    fetchBeds24Messages(),
    getDraftedReplies(),
  ]);

  // Attach real Lisa drafts to mock messages too (overrides hardcoded suggestedReply
  // when Lisa has drafted something for that message ID)
  const enriched = messages.map((m: any) => {
    const rawId = m.id?.toString().replace('beds24-', '');
    const draft = draftedReplies[rawId]?.draft;
    return draft ? { ...m, suggestedReply: draft } : m;
  });

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { messageId, reply } = body;
  
  if (!messageId || !reply) {
    return NextResponse.json(
      { ok: false, error: "messageId and reply are required" },
      { status: 400 }
    );
  }

  try {
    // TODO: Implement actual reply sending via Beds24 API
    // For now, just acknowledge the reply was received
    console.log(`Reply to message ${messageId}: ${reply}`);
    
    return NextResponse.json({ 
      ok: true, 
      message: "Reply queued for sending" 
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to send reply" },
      { status: 500 }
    );
  }
}