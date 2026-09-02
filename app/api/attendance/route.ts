import { NextRequest, NextResponse } from "next/server";

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
      console.error("Attendance fetch error:", error);

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
    console.error("Attendance API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch attendance records.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      id,
      time_in,
      time_out,
      attendance_date,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendance ID is required.",
        },
        { status: 400 }
      );
    }

    const updateData: {
      time_in?: string | null;
      time_out?: string | null;
      attendance_date?: string;
    } = {};

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "time_in"
      )
    ) {
      updateData.time_in = time_in || null;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "time_out"
      )
    ) {
      updateData.time_out = time_out || null;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "attendance_date"
      ) &&
      attendance_date
    ) {
      updateData.attendance_date =
        attendance_date;
    }

    const { data, error } =
      await supabaseAdmin
        .from("attendance")
        .update(updateData)
        .eq("id", id)
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
        .single();

    if (error) {
      console.error(
        "Attendance update error:",
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
      "Attendance PATCH error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update attendance.",
      },
      { status: 500 }
    );
  }
}