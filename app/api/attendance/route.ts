import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("attendance")
      .select(`
        *,
        employees (
          telegram_id,
          telegram_username,
          first_name,
          last_name
        ),
        attendance_breaks (
          id,
          break_start,
          break_end
        )
      `)
      .order("attendance_date", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Attendance fetch error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Attendance API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch attendance records",
      },
      { status: 500 }
    );
  }
}