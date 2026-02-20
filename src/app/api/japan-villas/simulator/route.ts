import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { getPropertyKnowledge, PropertyKnowledge } from "../guidebook-knowledge";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

interface SimulatorRequest {
  message: string;
  guestName: string;
  property: string;
  propertyDetails: {
    beds24Id: string;
    name: string;
    location: string;
    checkIn: string;
    checkOut: string;
    airbnbUrl?: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: SimulatorRequest = await request.json();
    const { message, guestName, property, propertyDetails } = body;

    if (!message || !guestName || !property) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Format the message as it would appear from a real booking platform
    const simulatedMessage = `🧪 SIMULATOR TEST MESSAGE

**Guest:** ${guestName}
**Property:** ${property} (${propertyDetails.location})
**Platform:** Test Simulator
**Booking Ref:** SIM-${Date.now().toString().slice(-6)}

**Message:**
${message}

---
*This is a test message from the Japan Villas dashboard simulator. Please respond as you would to a real guest.*`;

    // Generate Lisa's response directly (simulating what she would say)
    const lisaResponse = generateLisaResponse(message, property, guestName, propertyDetails);

    // Also send to Slack channel for real monitoring (fire and forget)
    try {
      execAsync(
        `openclaw message send --channel slack --target C0AFH8LF3TK --message "${simulatedMessage.replace(/"/g, '\\"')}"`,
        {
          timeout: 5000,
          env: { ...process.env, PATH: `${process.env.PATH}:/opt/homebrew/bin:/usr/local/bin` },
        }
      ).catch(() => {}); // Don't block on Slack delivery
    } catch {
      // Ignore Slack errors - the response should work regardless
    }

    return NextResponse.json({
      success: true,
      response: lisaResponse,
      method: "lisa-direct",
    });

  } catch (error) {
    console.error("Simulator API error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process test message. Please check that OpenClaw is running properly.",
        response: "❌ Unable to send test message. Please try again or contact support."
      },
      { status: 500 }
    );
  }
}

function checkPastConversations(property: string, topic: string): { shouldEscalate: boolean, context: string } {
  // Simulate checking past guest conversations for this property
  // In reality, this would query a database of past guest interactions
  
  const mockPastData = {
    "LAKE HOUSE 野尻湖": {
      earlyCheckin: {
        success: 3,
        failed: 1,
        notes: "Usually possible if arriving after 13:00, but depends on previous guest checkout and housekeeping completion. Failed once when previous guest extended stay."
      },
      lateCheckout: {
        success: 2,
        failed: 2,
        notes: "Mixed success. Depends heavily on next guest arrival time and day of week. Weekend bookings more challenging."
      }
    },
    "MOUNTAIN VILLA ニセコ": {
      earlyCheckin: {
        success: 2, 
        failed: 0,
        notes: "Generally accommodated. Mountain location means fewer back-to-back bookings."
      },
      lateCheckout: {
        success: 3,
        failed: 0,
        notes: "Usually possible due to mountain location and longer guest stays. Less pressure on housekeeping."
      }
    },
    "The Lake Side INN": {
      earlyCheckin: {
        success: 1,
        failed: 2,
        notes: "Difficult due to multiple cabins and cleaning schedule. Often not possible before 14:30."
      },
      lateCheckout: {
        success: 1,
        failed: 3,
        notes: "Very challenging due to multiple cabin turnovers and coordinated housekeeping schedule across units."
      }
    }
  };

  const propertyData = mockPastData[property as keyof typeof mockPastData];
  
  if ((topic === 'earlyCheckin' && propertyData?.earlyCheckin) || (topic === 'lateCheckout' && propertyData?.lateCheckout)) {
    const data = topic === 'earlyCheckin' ? propertyData.earlyCheckin : propertyData.lateCheckout;
    const successRate = data.success / (data.success + data.failed);
    const topicName = topic === 'earlyCheckin' ? 'early check-in' : 'late checkout';
    
    if (successRate >= 0.8) {
      return { 
        shouldEscalate: false, 
        context: `Based on past experience (${data.success}/${data.success + data.failed} successful), ${topicName} is usually possible. ${data.notes}` 
      };
    } else if (successRate <= 0.4) {
      return { 
        shouldEscalate: true, 
        context: `Based on past experience (${data.success}/${data.success + data.failed} successful), ${topicName} is often challenging. ${data.notes}` 
      };
    } else {
      return { 
        shouldEscalate: true, 
        context: `Mixed results with ${topicName} (${data.success}/${data.success + data.failed} successful). ${data.notes}` 
      };
    }
  }
  
  // Default: escalate when uncertain
  return { shouldEscalate: true, context: "No clear precedent found in past conversations." };
}

function generateLisaResponse(message: string, property: string, guestName: string, propertyDetails: any): string {
  const msg = message.toLowerCase();
  const location = propertyDetails.location || "Japan";
  const checkInTime = propertyDetails.checkIn || "15:00";
  const checkOutTime = propertyDetails.checkOut || "11:00";
  
  // Get real guidebook knowledge
  const knowledge = getPropertyKnowledge(property);
  const isJapanese = /[ひらがなカタカナ]/.test(message) || msg.includes('チェック') || msg.includes('時間') || msg.includes('お願い');
  
  // Check-in related - use guidebook knowledge + past conversations
  if (msg.includes('check') && (msg.includes('in') || msg.includes('early'))) {
    // First check if guidebook has specific self-check-in instructions
    if (knowledge && knowledge.commonQuestions.checkin) {
      const checkinInfo = isJapanese && knowledge.commonQuestions.checkin.answerJP 
        ? knowledge.commonQuestions.checkin.answerJP 
        : knowledge.commonQuestions.checkin.answer;
      
      return `Hello ${guestName}! 🏡

${checkinInfo}

If you have any questions about the check-in process or need assistance, please don't hesitate to ask!

Best regards,
Lisa 💜
Japan Villas Concierge`;
    }
    
    // For early check-in requests, check past conversations and escalate if uncertain
    if (msg.includes('early') || msg.includes('before')) {
      const pastData = checkPastConversations(property, 'earlyCheckin');
      
      if (pastData.shouldEscalate) {
        const lisaResponse = `Hello ${guestName}! 🏡

Thank you for reaching out about early check-in at ${property}.

I'd like to check with our Head of Operations, Ryosuke, to give you the most accurate information about availability for your 1pm arrival. He'll have the most up-to-date information about housekeeping schedules and previous guest checkout status.

I'll get back to you within 30 minutes with a definitive answer. In the meantime, if you do arrive early, you're welcome to explore the beautiful ${location} area.

🏠 **Standard check-in:** ${checkInTime}  
📋 **Your request:** Early check-in around 1:00 PM

I'll make sure we get this sorted for you!

Best regards,
Lisa 💜`;

        // Background Slack escalation with Lisa's analysis
        const slackEscalation = `🏡 **GUEST ESCALATION - Early Check-in Request**

**Property:** ${property}
**Guest:** ${guestName}
**Request:** Early check-in at 1:00 PM (standard: ${checkInTime})

**Lisa's Assessment:**
${pastData.context}

**Why I'm escalating:**
Based on historical data, this property has mixed success with early check-in requests. I need your input on current housekeeping schedule and next guest status to give an accurate response.

**Lisa's suggested response:**
"Based on your booking date and our current schedule, early check-in at 1pm [IS/IS NOT] possible. [If yes: Your room will be ready by then] [If no: I can arrange luggage storage and recommend activities until 3pm]"

**Original guest message:** "${message}"

@ryosuke.matsumoto - Please advise on feasibility and I'll follow up with guest. Target response: 30 minutes.`;

        // Send to background Slack (existing logic)
        try {
          execAsync(
            `openclaw message send --channel slack --target C0AFH8LF3TK --message "${slackEscalation.replace(/"/g, '\\"')}"`,
            {
              timeout: 5000,
              env: { ...process.env, PATH: `${process.env.PATH}:/opt/homebrew/bin:/usr/local/bin` },
            }
          ).catch(() => {});
        } catch {}

        return lisaResponse;
      } else {
        return `Hello ${guestName}! 🏡

Great news! Early check-in at ${property} should be possible for your 1pm arrival.

${pastData.context}

I'll confirm availability for your specific date and get back to you within the hour. Based on our experience with this property, early check-in is usually accommodated when guests arrive after 1pm.

🏠 **Standard check-in:** ${checkInTime}  
📋 **Your request:** Early check-in around 1:00 PM  
✅ **Outlook:** Very likely possible

I'll send you confirmation once I verify with our housekeeping schedule!

Looking forward to welcoming you to ${property}!

Best regards,
Lisa 💜
Japan Villas Concierge`;
      }
    }
    
    // General check-in inquiry
    return `Hello ${guestName}! 🏡

Thank you for reaching out about check-in at ${property}. 

Our standard check-in time is ${checkInTime}. Check-in is self-service, so you can arrive anytime after ${checkInTime} using the keybox system with the code provided in your booking confirmation.

If you have any specific questions about the check-in process, please let me know!

Best regards,
Lisa 💜
Japan Villas Concierge`;
  }
  
  // WiFi related - use real guidebook knowledge
  if (msg.includes('wifi') || msg.includes('password') || msg.includes('internet')) {
    if (knowledge && knowledge.commonQuestions.wifi) {
      const wifiInfo = isJapanese && knowledge.commonQuestions.wifi.answerJP 
        ? knowledge.commonQuestions.wifi.answerJP 
        : knowledge.commonQuestions.wifi.answer;
      
      return `Hi ${guestName}! 📶

${wifiInfo}

If you're having any connection issues, please let me know and I can help troubleshoot!

Best regards,
Lisa 💜
Japan Villas Concierge`;
    }
    
    // Fallback if no specific knowledge available
    return `Hi ${guestName}! 📶

The WiFi information for ${property} should be displayed prominently in your accommodation. Please check:
• Information folder on the table/desk  
• Welcome card near the entrance
• WiFi details posted on the refrigerator

If you can't locate the WiFi information, please take a photo of your surroundings and I'll help you find it immediately!

Best regards,
Lisa 💜`;
  }
  
  // Ice maker (specific to Lake House)
  if (msg.includes('ice') && property.includes('LAKE HOUSE')) {
    return `Hello ${guestName}! 🧊

Great question! The ${property} has something special - a **professional HOSHIZAKI ice maker** (the same brand used in restaurants and hotels)!

❄️ **Unlimited fresh ice** - The machine produces crystal-clear ice continuously
🥤 **Perfect for drinks** - Especially refreshing with the carbonated water server
🏠 **Location:** You'll find it in the kitchen area

The ice maker is always ready to use - just open it up and take what you need! Perfect for enjoying drinks while taking in those beautiful lake views.

Best regards,
Lisa 💜`;
  }

  // Carbonated water (specific to Lake House)  
  if ((msg.includes('soda') || msg.includes('carbonated') || msg.includes('sparkling') || msg.includes('bubble')) && property.includes('LAKE HOUSE')) {
    return `Hello ${guestName}! 💧

You're going to love this feature! The ${property} has a **carbonated water server** with unlimited use!

🫧 **How to use:** Simply pull the lever and enjoy fresh sparkling water
💰 **Completely free** - As much as you want during your stay
🧊 **Perfect combo** - Use with the professional ice maker for the perfect drink
🥤 **Great for:** Mixing with drinks, refreshing after exploring the lake area

It's one of the special touches that makes your stay extra enjoyable!

Best regards,
Lisa 💜`;
  }

  // Kitchen/cooking related - use specific appliance knowledge
  if (msg.includes('cook') || msg.includes('kitchen') || msg.includes('stove') || msg.includes('microwave') || msg.includes('rice cooker') || msg.includes('appliance')) {
    if (knowledge && knowledge.commonQuestions.kitchen) {
      return `Hello ${guestName}! 👨‍🍳

${knowledge.commonQuestions.kitchen.answer}

Everything is ready for you to cook delicious meals during your stay! If you need help operating any of the appliances, just let me know.

Best regards,
Lisa 💜`;
    }
    
    // General kitchen response
    return `Hello ${guestName}! 👨‍🍳

The kitchen at ${property} is fully equipped for cooking! You'll find:
🔥 **Cooking facilities** - Stove/cooktop  
🍚 **Rice cooker** - Perfect for Japanese meals
📱 **Microwave** - For quick heating
🫖 **Electric kettle** - For tea, coffee, instant noodles
❄️ **Refrigerator** - Full-size for storing groceries
🍽️ **Cookware & dishes** - Pots, pans, plates, utensils

Feel free to use everything and make yourself at home!

Best regards,  
Lisa 💜`;
  }

  // Restaurant/food recommendations
  if (msg.includes('restaurant') || msg.includes('food') || msg.includes('dinner') || msg.includes('eat')) {
    return `Hello ${guestName}! 🍽️

I'd love to help you discover some amazing local dining near ${property} in ${location}!

Here are my top recommendations:
🍜 **Local Specialties**: Try the regional dishes - each area of Japan has unique flavors
🍺 **Izakayas**: Great for authentic Japanese pub food and atmosphere  
🍱 **Family Restaurants**: Perfect for comfortable, reasonably priced meals
🍣 **Sushi**: Ask me for the best local sushi spots (not just tourist places!)

What type of cuisine are you in the mood for? And what's your budget range? I can send you specific recommendations with directions and how to order!

Best regards,
Lisa 💜`;
  }
  
  // Transport/directions
  if (msg.includes('train') || msg.includes('station') || msg.includes('transport') || msg.includes('taxi') || msg.includes('bus')) {
    return `Hi ${guestName}! 🚃

For transportation from ${property}:

**Train Station**: The nearest station is typically 10-20 minutes away
**Bus**: Local buses run regularly - I'll send you the schedule and route
**Taxi**: Usually ¥600-1500 depending on distance, very convenient
**Walking**: Many attractions might be walkable - great for sightseeing!

Let me send you:
📍 Detailed directions with maps
🕐 Transportation schedules
💴 Estimated costs
📱 Useful transport apps for Japan

What's your destination? I can give you the best route options!

Best regards,
Lisa 💜`;
  }
  
  // Late checkout - check feasibility and escalate if needed
  if (msg.includes('checkout') && (msg.includes('late') || msg.includes('later') || msg.includes('extend'))) {
    const pastData = checkPastConversations(property, 'lateCheckout');
    
    if (pastData.shouldEscalate) {
      const lisaResponse = `Hello ${guestName}! 🕐

Thank you for your late checkout request at ${property}.

I'd like to check with our Head of Operations, Ryosuke, who has access to our booking calendar and can give you the most accurate information about what's possible for your departure date.

I'll get back to you within 30 minutes with a definitive answer about extending your checkout time.

📋 **Standard checkout:** ${checkOutTime}  
🕐 **Your request:** Late checkout  

Best regards,
Lisa 💜`;

      const slackEscalation = `🏡 **GUEST ESCALATION - Late Checkout Request**

**Property:** ${property}
**Guest:** ${guestName}
**Request:** Late checkout (standard: ${checkOutTime})

**Lisa's Assessment:**
${pastData.context}

**Why I'm escalating:**
Late checkout success varies significantly based on next guest arrival times and housekeeping coordination. I need your input on the specific date's booking schedule to provide an accurate response.

**Lisa's suggested response:**
"For your departure date, late checkout until [TIME] [IS/IS NOT] possible. [If yes: No additional charge for extension until [TIME]] [If no: I can arrange luggage storage so you can enjoy your last day]"

**Original guest message:** "${message}"

@ryosuke.matsumoto - Please check booking calendar and housekeeping schedule. Target response: 30 minutes.`;

      // Send to background Slack
      try {
        execAsync(
          `openclaw message send --channel slack --target C0AFH8LF3TK --message "${slackEscalation.replace(/"/g, '\\"')}"`,
          { timeout: 5000, env: { ...process.env, PATH: `${process.env.PATH}:/opt/homebrew/bin:/usr/local/bin` } }
        ).catch(() => {});
      } catch {}

      return lisaResponse;
    } else {
      return `Hello ${guestName}! 🕐

I'd be happy to help with late checkout at ${property}!

Our standard checkout time is ${checkOutTime}, but based on past experience, we can often accommodate late checkout until 13:00 or sometimes even later, depending on our next guest's arrival.

Let me check our specific schedule for your departure date and confirm the latest possible time. I'll get back to you within 30 minutes.

If late checkout isn't available for some reason, we do have luggage storage options so you can still enjoy your last day without carrying bags around!

Best regards,
Lisa 💜`;
    }
  }
  
  // Activities/attractions
  if (msg.includes('activity') || msg.includes('activities') || msg.includes('attraction') || msg.includes('see') || msg.includes('visit')) {
    return `Hi ${guestName}! 🗾

${location} has so many wonderful experiences to offer! Here's what I recommend:

🏛️ **Cultural**: Temples, shrines, and traditional architecture
🌸 **Nature**: Scenic walks, gardens, and seasonal highlights  
♨️ **Relaxation**: Local onsen (hot springs) - perfect after sightseeing
🎌 **Local Life**: Markets, traditional crafts, local festivals
🍶 **Experiences**: Tea ceremony, sake tasting, cooking classes

What interests you most? I can create a personalized day itinerary with:
• Exact locations and directions
• Opening hours and costs
• How to get there from ${property}
• Local tips for the best experience

Just let me know your preferences and energy level!

Best regards,
Lisa 💜`;
  }
  
  // Complaints or problems that need escalation
  if (msg.includes('problem') || msg.includes('issue') || msg.includes('broken') || msg.includes('not working') || 
      msg.includes('dirty') || msg.includes('complaint') || msg.includes('refund') || msg.includes('compensation') ||
      msg.includes('unhappy') || msg.includes('disappointed') || msg.includes('terrible') || msg.includes('awful')) {
    
    const lisaResponse = `Hello ${guestName},

I understand you're experiencing some concerns with your stay at ${property}. I want to make sure we address this properly and get you the best possible resolution.

I'm immediately connecting you with **Ryosuke Matsumoto**, our Head of Operations & Experience, who has the authority to resolve operational issues and ensure your stay meets our high standards.

He will personally review your situation and get back to you within 15 minutes with a solution.

Please know that we take all guest concerns seriously and will work to make this right.

Best regards,
Lisa 💜`;

    const slackEscalation = `🚨 **HIGH PRIORITY GUEST ESCALATION - Property Issues**

**Property:** ${property}
**Guest:** ${guestName}
**Issue Type:** Property problems/complaints

**Lisa's Assessment:**
Guest reported issues that require immediate operational attention. This appears to involve property facilities/amenities that impact guest experience and satisfaction.

**Why I'm escalating:**
- Property maintenance/operational issues are outside my scope
- Guest satisfaction at risk - needs immediate resolution
- Requires on-ground assessment and potential compensation discussion

**Lisa's suggested response approach:**
1. Acknowledge the specific issues mentioned
2. Provide immediate timeline for resolution/repair
3. Offer appropriate compensation/gesture of goodwill
4. Ensure guest comfort during resolution period

**Original guest message:** "${message}"

@ryosuke.matsumoto **URGENT** - Guest experiencing property issues. Please respond within 15 minutes with action plan.`;

    // Send to background Slack
    try {
      execAsync(
        `openclaw message send --channel slack --target C0AFH8LF3TK --message "${slackEscalation.replace(/"/g, '\\"')}"`,
        { timeout: 5000, env: { ...process.env, PATH: `${process.env.PATH}:/opt/homebrew/bin:/usr/local/bin` } }
      ).catch(() => {});
    } catch {}

    return lisaResponse;
  }

  // Refund or pricing questions - always escalate
  if (msg.includes('refund') || msg.includes('money back') || msg.includes('cancel') || msg.includes('price') || msg.includes('charge')) {
    const lisaResponse = `Hello ${guestName},

Thank you for reaching out regarding your booking at ${property}.

For any questions related to pricing, charges, cancellations, or refunds, I need to connect you directly with **Ryosuke Matsumoto**, our Head of Operations & Experience, who handles all financial matters.

He has access to your booking details and the authority to assist with any billing or cancellation questions you may have.

You'll hear back from him within 30 minutes.

Best regards,
Lisa 💜`;

    const slackEscalation = `💰 **GUEST ESCALATION - Financial/Billing Inquiry**

**Property:** ${property}
**Guest:** ${guestName}
**Request Type:** Billing/refund/cancellation question

**Lisa's Assessment:**
Guest inquiry involves financial/booking matters that require access to billing system and authorization to process refunds or adjustments.

**Why I'm escalating:**
- Financial matters are outside my authorization level
- Requires access to booking system and payment processing
- May involve refund calculations or policy interpretation
- Guest satisfaction and trust critical for financial issues

**Lisa's suggested response approach:**
1. Review booking details and payment history
2. Assess eligibility based on cancellation policy
3. Calculate any applicable refunds or adjustments
4. Provide clear explanation of decision and next steps
5. Process any approved refunds promptly

**Original guest message:** "${message}"

@ryosuke.matsumoto - Financial inquiry requiring review of booking and potential refund processing. Target response: 30 minutes.`;

    // Send to background Slack
    try {
      execAsync(
        `openclaw message send --channel slack --target C0AFH8LF3TK --message "${slackEscalation.replace(/"/g, '\\"')}"`,
        { timeout: 5000, env: { ...process.env, PATH: `${process.env.PATH}:/opt/homebrew/bin:/usr/local/bin` } }
      ).catch(() => {});
    } catch {}

    return lisaResponse;
  }

  // Japanese message
  if (msg.includes('チェック') || msg.includes('時間') || msg.includes('お願い') || msg.includes('ありがとう') || /[ひらがな]/.test(message) || /[カタカナ]/.test(message)) {
    return `${guestName}様

お問い合わせいただき、ありがとうございます。🏡

${property}でのご滞在をより快適にお過ごしいただけるよう、最善を尽くしてサポートさせていただきます。

ご要望の件について確認し、30分以内にご連絡いたします。その他ご不明な点やご質問がございましたら、いつでもお気軽にお声がけください。

${location}での素敵なご滞在となりますよう、心よりお祈りしております。

Japan Villas コンシェルジュ
Lisa 💜`;
  }
  
  // General response
  return `Hello ${guestName}! 🏡

Thank you for reaching out about your stay at ${property}! I'm Lisa, your dedicated concierge for Japan Villas.

I've received your message and will personally ensure you get the best possible experience during your stay in ${location}.

I'll research your inquiry and get back to you with detailed information within the hour. In the meantime, if you have any urgent questions or need immediate assistance, please don't hesitate to reach out!

We're here to make your Japan experience truly memorable.

Best regards,
Lisa 💜
Japan Villas Concierge`;
}