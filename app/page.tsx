"use client";

import { useEffect, useState } from "react";

type Attendance = {
  id: string;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  recorded_at?: string | null;
  updated_at?: string | null;
};

function formatTime(value: string | null) {
  if (!value) return "--";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+08:00`));
}

export default function Home() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      try {
        const response = await fetch("/api/attendance", {
          cache: "no-store",
        });

        const result = await response.json();

        if (result.success) {
          setAttendance(result.data || []);
        }
      } catch (error) {
        console.error("Failed to load attendance:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, []);

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const todayAttendance = attendance.find(
    (item) => item.attendance_date === today
  );

  const status = !todayAttendance
    ? "Not Started"
    : todayAttendance.time_out
      ? "Completed"
      : "Working";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Labrador TimeTrack
            </h1>

            <p className="text-sm text-slate-500">
              Employee Attendance System
            </p>
          </div>

          <div className="hidden rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium sm:block">
            🇵🇭 Philippines
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* WELCOME */}
        <section className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            Dashboard
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight">
            Good day 👋
          </h2>

          <p className="mt-2 text-slate-500">
            Here&apos;s your attendance overview for today.
          </p>
        </section>

        {/* STAT CARDS */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* DATE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Today
            </p>

            <p className="mt-3 text-lg font-semibold">
              {formatDate(today)}
            </p>
          </div>

          {/* TIME IN */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Time In
            </p>

            <p className="mt-3 text-2xl font-bold">
              {loading
                ? "..."
                : formatTime(todayAttendance?.time_in ?? null)}
            </p>
          </div>

          {/* TIME OUT */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Time Out
            </p>

            <p className="mt-3 text-2xl font-bold">
              {loading
                ? "..."
                : formatTime(todayAttendance?.time_out ?? null)}
            </p>
          </div>

          {/* STATUS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Status
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  status === "Working"
                    ? "bg-green-500"
                    : status === "Completed"
                      ? "bg-blue-500"
                      : "bg-slate-300"
                }`}
              />

              <span className="text-xl font-bold">
                {loading ? "..." : status}
              </span>
            </div>
          </div>
        </section>

        {/* TODAY */}
        <section className="mt-8">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">
              <h3 className="text-lg font-bold">
                Today&apos;s Attendance
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your attendance record for today
              </p>
            </div>

            <div className="p-6">

              {!loading && !todayAttendance ? (
                <div className="rounded-xl bg-slate-50 px-6 py-10 text-center">
                  <div className="text-4xl">🕐</div>

                  <p className="mt-3 font-semibold">
                    No attendance record yet
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Use the Labrador Telegram Bot to time in.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-3">

                  <div>
                    <p className="text-sm text-slate-500">
                      Time In
                    </p>

                    <p className="mt-2 text-xl font-semibold">
                      {loading
                        ? "..."
                        : formatTime(
                            todayAttendance?.time_in ?? null
                          )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Time Out
                    </p>

                    <p className="mt-2 text-xl font-semibold">
                      {loading
                        ? "..."
                        : formatTime(
                            todayAttendance?.time_out ?? null
                          )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Status
                    </p>

                    <p className="mt-2 text-xl font-semibold">
                      {loading ? "..." : status}
                    </p>
                  </div>

                </div>
              )}
            </div>
          </div>
        </section>

        {/* RECENT ATTENDANCE */}
        <section className="mt-8">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">
              <h3 className="text-lg font-bold">
                Recent Attendance
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Latest attendance records
              </p>
            </div>

            <div className="overflow-x-auto">

              {loading ? (
                <div className="px-6 py-10 text-center text-slate-500">
                  Loading attendance...
                </div>
              ) : attendance.length === 0 ? (
                <div className="px-6 py-10 text-center text-slate-500">
                  No attendance records found.
                </div>
              ) : (
                <table className="w-full min-w-[600px] text-left text-sm">

                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">
                        Date
                      </th>

                      <th className="px-6 py-4">
                        Time In
                      </th>

                      <th className="px-6 py-4">
                        Time Out
                      </th>

                      <th className="px-6 py-4">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {attendance
                      .slice(0, 10)
                      .map((record) => {

                        const completed =
                          !!record.time_out;

                        return (
                          <tr
                            key={record.id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-6 py-4 font-medium">
                              {formatDate(
                                record.attendance_date
                              )}
                            </td>

                            <td className="px-6 py-4">
                              {formatTime(
                                record.time_in
                              )}
                            </td>

                            <td className="px-6 py-4">
                              {formatTime(
                                record.time_out
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  completed
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-green-50 text-green-700"
                                }`}
                              >
                                {completed
                                  ? "Completed"
                                  : "Working"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                  </tbody>
                </table>
              )}

            </div>
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <footer className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-slate-400">
        Labrador TimeTrack © 2026
      </footer>
    </main>
  );
}