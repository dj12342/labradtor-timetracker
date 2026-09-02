import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

// ==========================================
// ADD BREAK
// ==========================================

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const {
      attendance_id,
      break_start,
      break_end,
    } = body;

    if (!attendance_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendance ID is required.",
        },
        { status: 400 }
      );
    }

    if (!break_start) {
      return NextResponse.json(
        {
          success: false,
          error: "Break start is required.",
        },
        { status: 400 }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("attendance_breaks")
        .insert({
          attendance_id,
          break_start,
          break_end: break_end || null,
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Break insert error:",
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
      "Break POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to add break.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// EDIT BREAK
// ==========================================

export async function PATCH(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const {
      id,
      break_start,
      break_end,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Break ID is required.",
        },
        { status: 400 }
      );
    }

    const updateData: {
      break_start?: string | null;
      break_end?: string | null;
    } = {};

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "break_start"
      )
    ) {
      updateData.break_start =
        break_start || null;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "break_end"
      )
    ) {
      updateData.break_end =
        break_end || null;
    }

    const { data, error } =
      await supabaseAdmin
        .from("attendance_breaks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
      console.error(
        "Break update error:",
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
      "Break PATCH error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update break.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE BREAK
// ==========================================

export async function DELETE(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Break ID is required.",
        },
        { status: 400 }
      );
    }

    const { error } =
      await supabaseAdmin
        .from("attendance_breaks")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "Break delete error:",
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
      message: "Break deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Break DELETE error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete break.",
      },
      { status: 500 }
    );
  }
}