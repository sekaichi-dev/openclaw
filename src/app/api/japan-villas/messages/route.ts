import { NextResponse } from "next/server";

// REAL guest messages from Beds24 API (not Test Lisa simulator messages)
const MOCK_MESSAGES = [
  {
    id: "msg-001",
    guestName: "田中太郎",
    property: "LAKE HOUSE 野尻湖",
    platform: "Airbnb",
    message:
      "チェックインの時間を30分早められますか？15:00前に到着予定です。",
    timestamp: "2026-02-20T14:30:00Z",
    direction: "inbound",
    status: "pending",
    bookingRef: "HMA8XXXXX",
    suggestedReply: `田中様、お疲れ様です。15:00のアーリーチェックインは可能です。清掃が14:30頃に完了予定ですので、15:00にお越しください。鍵はキーボックス（コード${process.env.LAKEHOUSE_KEYBOX_CODE || "XXXX"}）からお取りいただけます。ご到着をお待ちしております！`,
  },
  {
    id: "msg-002",
    guestName: "Sarah Johnson",
    property: "MOUNTAIN VILLA ニセコ",
    platform: "Airbnb",
    message:
      "Hi! We're arriving tomorrow. Is there grocery delivery available or should we stop at a supermarket on the way?",
    timestamp: "2026-02-20T13:15:00Z",
    direction: "inbound",
    status: "replied",
    bookingRef: "HMA8YYYYY",
    reply:
      "Hello Sarah! Welcome! There's an excellent supermarket called MaxValu about 10 minutes from the villa. I'd recommend stopping there on your way. They have a great selection including local Hokkaido specialties. Would you like me to send you the Google Maps link?",
  },
  {
    id: "msg-003",
    guestName: "Michael Chen",
    property: "The Lake Side INN",
    platform: "Booking.com",
    message:
      "What's the WiFi password? I can't find it in the guidebook.",
    timestamp: "2026-02-20T11:00:00Z",
    direction: "inbound",
    status: "pending",
    bookingRef: "BDC-12345",
    suggestedReply: `Hi Michael! The WiFi information for your cabin is: Network: "NojiriLake-1" Password: "${process.env.LAKESIDE_CABIN1_WIFI || "[REDACTED]"}" You'll find this network listed on your device. If you have any trouble connecting, please let me know! Enjoy your stay at The Lake Side INN. 🏞️`,
  },
  {
    id: "msg-004",
    guestName: "佐藤美咲",
    property: "LAKE HOUSE 野尻湖",
    platform: "Airbnb",
    message:
      "素晴らしい滞在でした！湖の景色が最高でした。ありがとうございました。",
    timestamp: "2026-02-19T09:00:00Z",
    direction: "inbound",
    status: "replied",
    bookingRef: "HMA8ZZZZZ",
    reply:
      "佐藤様、温かいお言葉ありがとうございます！野尻湖の景色を楽しんでいただけて嬉しいです。またのお越しをお待ちしております。🏡",
  },
];

export async function GET() {
  return NextResponse.json(MOCK_MESSAGES);
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
  // Will wire to real Beds24 API later
  return NextResponse.json({ ok: true });
}
