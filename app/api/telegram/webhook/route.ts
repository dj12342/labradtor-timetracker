import { NextRequest, NextResponse } from "next/server";

import {
  sendTelegramMessage,
  answerCallbackQuery,
} from "@/lib/telegram";

import { supabaseAdmin } from "@/lib/supabase-admin";

// ============================================
// TYPES
// ============================================

type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramChat = {
  id: number;
  type: string;
};

type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
};

type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

// ============================================
// HELPERS
// ============================================

function getManilaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatManilaTime(date: string | Date | null) {
  if (!date) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

function formatManilaDate(date: string) {
  const parsed = new Date(`${date}T00:00:00+08:00`);

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function getDisplayName(user: TelegramUser) {
  const fullName = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return fullName || user.username || "Unknown User";
}

function getUsername(user: TelegramUser) {
  return user.username
    ? `@${user.username}`
    : getDisplayName(user);
}

// ============================================
// ATTENDANCE KEYBOARD
// ============================================

function attendanceKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🟢 TIME IN",
          callback_data: "time_in",
        },
        {
          text: "🔴 TIME OUT",
          callback_data: "time_out",
        },
      ],
      [
        {
          text: "🍴 START BREAK",
          callback_data: "break_start",
        },
        {
          text: "🔙 END BREAK",
          callback_data: "break_end",
        },
      ],
      [
        {
          text: "📋 MY STATUS",
          callback_data: "status",
        },
      ],
    ],
  };
}

// ============================================
// EMPLOYEE
// ============================================

async function getOrCreateEmployee(user: TelegramUser) {
  const { data: existing, error: findError } =
    await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("telegram_id", user.id)
      .maybeSingle();

  if (findError) {
    throw findError;
  }

  // Existing employee
  if (existing) {
    const { data: updated, error } =
      await supabaseAdmin
        .from("employees")
        .update({
          telegram_username: user.username ?? null,
          first_name: user.first_name ?? null,
          last_name: user.last_name ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

    if (error) {
      throw error;
    }

    return updated;
  }

  // New employee
  const { data: created, error } =
    await supabaseAdmin
      .from("employees")
      .insert({
        telegram_id: user.id,
        telegram_username: user.username ?? null,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return created;
}

// ============================================
// SEND ATTENDANCE MENU
// ============================================

async function sendAttendanceMenu(
  chatId: number,
  user: TelegramUser
) {
  const name = getDisplayName(user);

  const text =
    `🕐 <b>LABRADOR ATTENDANCE</b>\n\n` +
    `Choose an action below:`;

  await sendTelegramMessage(
    chatId,
    text,
    attendanceKeyboard()
  );
}

// ============================================
// TIME IN
// ============================================

async function handleTimeIn(
  chatId: number,
  user: TelegramUser
) {
  const employee = await getOrCreateEmployee(user);

  if (!employee.is_active) {
    await sendTelegramMessage(
      chatId,
      "❌ Your employee account is inactive."
    );

    return;
  }

  const today = getManilaDate();

  const { data: existing, error: findError } =
    await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("attendance_date", today)
      .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existing?.time_in) {
    await sendTelegramMessage(
      chatId,
      `⚠️ <b>Already timed in.</b>\n\n` +
        `Time in: <b>${formatManilaTime(
          existing.time_in
        )}</b>`
    );

    return;
  }

  const now = new Date().toISOString();

  if (existing) {
    const { error } = await supabaseAdmin
      .from("attendance")
      .update({
        time_in: now,
        updated_at: now,
      })
      .eq("id", existing.id);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabaseAdmin
      .from("attendance")
      .insert({
        employee_id: employee.id,
        attendance_date: today,
        time_in: now,
      });

    if (error) {
      throw error;
    }
  }

  await sendTelegramMessage(
    chatId,
    `✅ <b>TIME IN RECORDED</b>\n\n` +
      `👤 ${getDisplayName(user)}\n` +
      `📅 ${formatManilaDate(today)}\n` +
      `🕐 ${formatManilaTime(now)}`
  );
}

// ============================================
// START BREAK
// ============================================

async function handleBreakStart(
  chatId: number,
  user: TelegramUser
) {
  const employee = await getOrCreateEmployee(user);

  const today = getManilaDate();

  const { data: attendance, error } =
    await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("attendance_date", today)
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!attendance?.time_in) {
    await sendTelegramMessage(
      chatId,
      "⚠️ You need to <b>TIME IN</b> first."
    );

    return;
  }

  if (attendance.time_out) {
    await sendTelegramMessage(
      chatId,
      "⚠️ You already timed out today."
    );

    return;
  }

  const { data: activeBreak, error: breakError } =
    await supabaseAdmin
      .from("attendance_breaks")
      .select("*")
      .eq("attendance_id", attendance.id)
      .is("break_end", null)
      .maybeSingle();

  if (breakError) {
    throw breakError;
  }

  if (activeBreak) {
    await sendTelegramMessage(
      chatId,
      `⚠️ <b>You are already on break.</b>\n\n` +
        `Started: ${formatManilaTime(
          activeBreak.break_start
        )}`
    );

    return;
  }

  const now = new Date().toISOString();

  const { error: insertError } =
    await supabaseAdmin
      .from("attendance_breaks")
      .insert({
        attendance_id: attendance.id,
        break_start: now,
      });

  if (insertError) {
    throw insertError;
  }

  await sendTelegramMessage(
    chatId,
    `🍴 <b>BREAK STARTED</b>\n\n` +
      `🕐 ${formatManilaTime(now)}`
  );
}

// ============================================
// END BREAK
// ============================================

async function handleBreakEnd(
  chatId: number,
  user: TelegramUser
) {
  const employee = await getOrCreateEmployee(user);

  const today = getManilaDate();

  const { data: attendance, error } =
    await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("attendance_date", today)
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!attendance) {
    await sendTelegramMessage(
      chatId,
      "⚠️ No attendance record found for today."
    );

    return;
  }

  const { data: activeBreak, error: breakError } =
    await supabaseAdmin
      .from("attendance_breaks")
      .select("*")
      .eq("attendance_id", attendance.id)
      .is("break_end", null)
      .order("break_start", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (breakError) {
    throw breakError;
  }

  if (!activeBreak) {
    await sendTelegramMessage(
      chatId,
      "⚠️ You don't have an active break."
    );

    return;
  }

  const now = new Date().toISOString();

  const { error: updateError } =
    await supabaseAdmin
      .from("attendance_breaks")
      .update({
        break_end: now,
      })
      .eq("id", activeBreak.id);

  if (updateError) {
    throw updateError;
  }

  await sendTelegramMessage(
    chatId,
    `🔙 <b>BREAK ENDED</b>\n\n` +
      `🕐 ${formatManilaTime(now)}`
  );
}

// ============================================
// STATUS
// ============================================

async function handleStatus(
  chatId: number,
  user: TelegramUser
) {
  const employee = await getOrCreateEmployee(user);

  const today = getManilaDate();

  const { data: attendance, error } =
    await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("attendance_date", today)
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!attendance) {
    await sendTelegramMessage(
      chatId,
      `📋 <b>MY STATUS</b>\n\n` +
        `No attendance record yet today.`
    );

    return;
  }

  const { data: breaks } =
    await supabaseAdmin
      .from("attendance_breaks")
      .select("*")
      .eq("attendance_id", attendance.id)
      .order("break_start", {
        ascending: true,
      });

  let breakText = "None";

  if (breaks && breaks.length > 0) {
    breakText = breaks
      .map((item, index) => {
        return (
          `Break ${index + 1}: ` +
          `${formatManilaTime(item.break_start)} - ` +
          `${
            item.break_end
              ? formatManilaTime(item.break_end)
              : "ONGOING"
          }`
        );
      })
      .join("\n");
  }

  await sendTelegramMessage(
    chatId,
    `📋 <b>MY STATUS</b>\n\n` +
      `📅 ${formatManilaDate(today)}\n` +
      `👤 ${getUsername(user)}\n\n` +
      `Time in: ${
        attendance.time_in
          ? formatManilaTime(attendance.time_in)
          : "--"
      }\n` +
      `${breakText}\n` +
      `Time out: ${
        attendance.time_out
          ? formatManilaTime(attendance.time_out)
          : "--"
      }`
  );
}

// ============================================
// TIME OUT + RECEIPT
// ============================================

async function handleTimeOut(
  chatId: number,
  user: TelegramUser
) {
  const employee = await getOrCreateEmployee(user);

  const today = getManilaDate();

  const { data: attendance, error } =
    await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("attendance_date", today)
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!attendance) {
    await sendTelegramMessage(
      chatId,
      "⚠️ You don't have an attendance record for today."
    );

    return;
  }

  if (!attendance.time_in) {
    await sendTelegramMessage(
      chatId,
      "⚠️ You haven't timed in yet."
    );

    return;
  }

  if (attendance.time_out) {
    await sendTelegramMessage(
      chatId,
      `⚠️ You already timed out at <b>${formatManilaTime(
        attendance.time_out
      )}</b>.`
    );

    return;
  }

  // Check active break
  const {
    data: activeBreak,
    error: activeBreakError,
  } = await supabaseAdmin
    .from("attendance_breaks")
    .select("*")
    .eq("attendance_id", attendance.id)
    .is("break_end", null)
    .maybeSingle();

  if (activeBreakError) {
    throw activeBreakError;
  }

  if (activeBreak) {
    await sendTelegramMessage(
      chatId,
      "⚠️ You still have an active break.\n\n" +
        "Please end your break first."
    );

    return;
  }

  const now = new Date().toISOString();

  const { error: updateError } =
    await supabaseAdmin
      .from("attendance")
      .update({
        time_out: now,
        updated_at: now,
      })
      .eq("id", attendance.id);

  if (updateError) {
    throw updateError;
  }

  // Get all breaks
  const { data: breaks, error: breaksError } =
    await supabaseAdmin
      .from("attendance_breaks")
      .select("*")
      .eq("attendance_id", attendance.id)
      .order("break_start", {
        ascending: true,
      });

  if (breaksError) {
    throw breaksError;
  }

  let breakText = "None";

  if (breaks && breaks.length > 0) {
    breakText = breaks
      .map((item, index) => {
        return (
          `Break ${index + 1}: ` +
          `${formatManilaTime(item.break_start)} - ` +
          `${
            item.break_end
              ? formatManilaTime(item.break_end)
              : "ONGOING"
          }`
        );
      })
      .join("\n");
  }

  // ========================================
  // RECEIPT
  // ========================================

  const receipt =
    `🧾 <b>ATTENDANCE RECORD</b>\n\n` +
    `Date: ${formatManilaDate(today)}\n` +
    `Username: ${getUsername(user)}\n\n` +
    `Time in: ${formatManilaTime(
      attendance.time_in
    )}\n` +
    `${breakText}\n` +
    `Time out: ${formatManilaTime(now)}\n\n` +
    `────────────────\n` +
    `Status: ✅ <b>Complete</b>`;

  await sendTelegramMessage(
    chatId,
    receipt
  );
}

// ============================================
// CALLBACK HANDLER
// ============================================

async function handleCallbackQuery(
  callback: TelegramCallbackQuery
) {
  const data = callback.data || "";

  const chatId = callback.message?.chat.id;

  if (!chatId) {
    await answerCallbackQuery(
      callback.id,
      "Chat not found."
    );

    return;
  }

  // IMPORTANT:
  // callback.from is ALWAYS the Telegram user
  // who actually clicked the button.
  const user = callback.from;

  await answerCallbackQuery(
    callback.id
  );

  switch (data) {
    case "time_in":
      await handleTimeIn(
        chatId,
        user
      );
      break;

    case "time_out":
      await handleTimeOut(
        chatId,
        user
      );
      break;

    case "break_start":
      await handleBreakStart(
        chatId,
        user
      );
      break;

    case "break_end":
      await handleBreakEnd(
        chatId,
        user
      );
      break;

    case "status":
      await handleStatus(
        chatId,
        user
      );
      break;

    default:
      break;
  }
}

// ============================================
// COMMAND HANDLER
// ============================================

async function handleMessage(
  message: TelegramMessage
) {
  if (!message.from || !message.text) {
    return;
  }

  const text = message.text
    .trim()
    .toLowerCase();

  const user = message.from;
  const chatId = message.chat.id;

  switch (text) {
    case "/start": {
      // First time or existing user.
      // This makes sure the employee exists.
      await getOrCreateEmployee(user);

      await sendAttendanceMenu(
        chatId,
        user
      );

      break;
    }

    case "/attendance": {
      await getOrCreateEmployee(user);

      await sendAttendanceMenu(
        chatId,
        user
      );

      break;
    }

    case "/timein": {
      await handleTimeIn(
        chatId,
        user
      );

      break;
    }

    case "/timeout": {
      await handleTimeOut(
        chatId,
        user
      );

      break;
    }

    case "/status": {
      await handleStatus(
        chatId,
        user
      );

      break;
    }

    default:
      break;
  }
}

// ============================================
// WEBHOOK POST
// ============================================

export async function POST(
  request: NextRequest
) {
  try {
    const update =
      (await request.json()) as TelegramUpdate;

    // ========================================
    // BUTTON CLICK
    // ========================================

    if (update.callback_query) {
      await handleCallbackQuery(
        update.callback_query
      );
    }

    // ========================================
    // MESSAGE / COMMAND
    // ========================================

    if (update.message) {
      await handleMessage(
        update.message
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Telegram webhook error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET
// ============================================

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Telegram Attendance Bot",
  });
}