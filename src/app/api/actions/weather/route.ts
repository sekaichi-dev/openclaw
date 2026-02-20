import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Simulate weather check - in production this would call a weather API
    const weatherData = {
      location: "Tokyo, Japan",
      temperature: "12°C",
      condition: "Partly Cloudy",
      humidity: "65%",
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      message: `Tokyo: ${weatherData.temperature} ${weatherData.condition}, humidity ${weatherData.humidity}`,
      success: true,
      data: weatherData
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Failed to fetch weather data", 
        message: "Weather check failed" 
      }, 
      { status: 500 }
    );
  }
}