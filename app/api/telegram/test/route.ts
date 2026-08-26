import { NextResponse } from "next/server";

export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken) {
      return NextResponse.json(
        { success: false, error: "TELEGRAM_BOT_TOKEN is missing" },
        { status: 500 }
      );
    }

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: "TELEGRAM_CHAT_ID is missing" },
        { status: 500 }
      );
    }

    const message =
      "✅ Telegram bot is working!\n\n" +
      "Your Next.js + Supabase project can now send Telegram notifications.";

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.description || "Telegram API request failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Telegram message sent successfully!",
    });
  } catch (error) {
    console.error("Telegram error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send Telegram message",
      },
      { status: 500 }
    );
  }
}