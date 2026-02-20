// Japan Villas Property Knowledge Base
// Extracted from actual guidebooks for Lisa's concierge responses

export interface PropertyKnowledge {
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  wifi: {
    networks: Array<{ name: string; password: string }>;
  };
  keyFeatures: string[];
  commonQuestions: {
    [key: string]: {
      answer: string;
      answerJP?: string;
    };
  };
}

export const PROPERTY_KNOWLEDGE: { [key: string]: PropertyKnowledge } = {
  "LAKE HOUSE 野尻湖": {
    name: "LAKE HOUSE 野尻湖",
    location: "Nojiri Lake, Nagano",
    checkIn: "15:00",
    checkOut: "11:00",
    wifi: {
      networks: [
        { name: "The Lake House - 2G", password: "[REDACTED]" },
        { name: "The Lake House - 5G", password: "[REDACTED]" }
      ]
    },
    keyFeatures: [
      "Professional HOSHIZAKI ice maker",
      "Carbonated water server (unlimited use)",
      "Lake view with stunning scenery",
      "Professional kitchen with IH stove, rice cooker (Zojirushi), microwave (Panasonic)",
      "T-fal electric kettle",
      "Large refrigerator (Panasonic 470L)",
      "Self check-in system with keybox"
    ],
    commonQuestions: {
      wifi: {
        answer: `The WiFi networks for LAKE HOUSE are:\n\n📶 **Network 1:** The Lake House - 2G\n📶 **Network 2:** The Lake House - 5G\n🔐 **Password:** [REDACTED]\n\nBoth networks use the same password. Choose the 5G network for faster speeds if your device supports it. You can also scan the WiFi QR code displayed in the property for instant connection!`,
        answerJP: `野尻湖レイクハウスのWiFi情報：\n\n📶 **ネットワーク1:** The Lake House - 2G\n📶 **ネットワーク2:** The Lake House - 5G\n🔐 **パスワード:** [REDACTED]\n\n両方のネットワークで同じパスワードをご利用いただけます。お使いのデバイスが対応している場合は、より高速な5Gネットワークをお選びください。物件内に表示されているWiFi QRコードをスキャンすると、すぐに接続できます！`
      },
      checkin: {
        answer: `Check-in at LAKE HOUSE is completely self-service! 🏡\n\n⏰ **Available from:** 15:00 onwards (anytime after 3 PM)\n🔑 **Process:** Use the keybox system - your entry code was provided in your booking confirmation\n📋 **No staff needed** - you can arrive anytime after 15:00\n\n✅ **Checkout:** Simply return the key to the keybox by 11:00 AM\n\nThe self-check-in system gives you complete flexibility with your arrival time!`,
        answerJP: `野尻湖レイクハウスはセルフチェックインシステムです！🏡\n\n⏰ **チェックイン:** 15:00以降いつでも可能\n🔑 **方法:** キーボックスシステム - 入館コードは予約確認書でお知らせしています\n📋 **スタッフ不要** - 15:00以降でしたらいつでもご到着いただけます\n\n✅ **チェックアウト:** 11:00までにキーボックスに鍵をお戻しください\n\nセルフチェックインシステムにより、到着時間は完全に自由です！`
      },
      kitchen: {
        answer: `The LAKE HOUSE kitchen is fully equipped for cooking! 👨‍🍳\n\n🔥 **IH Stove** - Induction cooktop (battery cover for replacement if needed)\n🍚 **Rice Cooker** - Zojirushi brand\n📱 **Microwave** - Panasonic\n🫖 **Electric Kettle** - T-fal\n🧊 **Ice Maker** - Professional HOSHIZAKI (business-grade!)\n💧 **Carbonated Water Server** - Unlimited use, just pull the lever\n\n🍽️ **Cookware & Dishes:** Pots, pans, plates, bowls, utensils all provided\n❄️ **Large Refrigerator:** Panasonic 470L\n\n**Tip:** Spare batteries for the IH stove are stored in the kitchen if needed!`
      }
    }
  },

  "The Lake Side INN": {
    name: "The Lake Side INN", 
    location: "Nojiri Lake, Nagano",
    checkIn: "15:00",
    checkOut: "11:00", 
    wifi: {
      networks: [
        { name: "Cabin 1", password: "[REDACTED]" },
        { name: "Cabin 2", password: "[REDACTED]" },
        { name: "Cabin 3", password: "[REDACTED]" },
        { name: "Cabin 4", password: "[REDACTED]" }
      ]
    },
    keyFeatures: [
      "Multiple cabin units with individual WiFi networks",
      "Lakeside location with beautiful views",
      "Each cabin has unique WiFi network and password",
      "QR codes available for easy WiFi connection"
    ],
    commonQuestions: {
      wifi: {
        answer: `The Lake Side INN has separate WiFi networks for each cabin:\n\n📶 **Cabin 1:** Network name varies, Password: **[REDACTED]**\n📶 **Cabin 2:** Network name varies, Password: **[REDACTED]**\n📶 **Cabin 3:** Network name varies, Password: **[REDACTED]**\n📶 **Cabin 4:** Network name varies, Password: **[REDACTED]**\n\n🏠 Please check which cabin you're staying in and use the corresponding password. Each cabin also has a WiFi QR code for instant connection!`,
        answerJP: `レイクサイドインでは各キャビンごとに異なるWiFiネットワークをご用意しています：\n\n📶 **キャビン1:** パスワード: **NojiriLake-1**\n📶 **キャビン2:** パスワード: **NomadWagon-2**\n📶 **キャビン3:** パスワード: **Lakeside Camper-3**\n📶 **キャビン4:** パスワード: **RoamCabin-4**\n\n🏠 ご宿泊のキャビン番号をご確認の上、対応するパスワードをご利用ください。各キャビンにWiFi QRコードもございます！`
      }
    }
  },

  "MOUNTAIN VILLA ニセコ": {
    name: "MOUNTAIN VILLA ニセコ",
    location: "Niseko, Hokkaido", 
    checkIn: "15:00",
    checkOut: "10:00",
    wifi: {
      networks: [
        { name: "mvniseko", password: "[REDACTED]" }
      ]
    },
    keyFeatures: [
      "Mountain location in famous Niseko ski resort area",
      "Perfect for winter sports and summer hiking",
      "Single WiFi network for the entire villa",
      "Beautiful mountain views"
    ],
    commonQuestions: {
      wifi: {
        answer: `The WiFi for MOUNTAIN VILLA ニセコ is:\n\n📶 **Network:** mvniseko\n🔐 **Password:** mountainv\n\n🎿 Perfect connection for sharing your Niseko adventures! The villa also has a WiFi QR code available for quick connection.`,
        answerJP: `ニセコマウンテンヴィラのWiFi情報：\n\n📶 **ネットワーク名:** mvniseko\n🔐 **パスワード:** mountainv\n\n🎿 ニセコでの冒険をシェアするのに最適な接続環境です！ヴィラ内にWiFi QRコードも設置しております。`
      }
    }
  }
};

export function getPropertyKnowledge(propertyName: string): PropertyKnowledge | null {
  return PROPERTY_KNOWLEDGE[propertyName] || null;
}