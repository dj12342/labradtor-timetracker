const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ENABLED =
  process.env.TELEGRAM_ENABLED === "true";

if (TELEGRAM_ENABLED && !BOT_TOKEN) {
  throw new Error(
    "TELEGRAM_BOT_TOKEN is missing"
  );
}

const TELEGRAM_API = BOT_TOKEN
  ? `https://api.telegram.org/bot${BOT_TOKEN}`
  : "";

export async function telegramRequest(
  method: string,
  body: Record<string, unknown>
) {
  if (!TELEGRAM_ENABLED) {
    return {
      ok: true,
      disabled: true,
    };
  }

  const response = await fetch(
    `${TELEGRAM_API}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok || !data.ok) {
    console.error(
      "Telegram API error:",
      data
    );

    throw new Error(
      data.description ||
        "Telegram API request failed"
    );
  }

  return data;
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: unknown
) {
  return telegramRequest(
    "sendMessage",
    {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...(replyMarkup
        ? {
            reply_markup: replyMarkup,
          }
        : {}),
    }
  );
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
) {
  return telegramRequest(
    "answerCallbackQuery",
    {
      callback_query_id:
        callbackQueryId,
      ...(text ? { text } : {}),
    }
  );
}

export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  replyMarkup?: unknown
) {
  return telegramRequest(
    "editMessageText",
    {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      ...(replyMarkup
        ? {
            reply_markup: replyMarkup,
          }
        : {}),
    }
  );
}