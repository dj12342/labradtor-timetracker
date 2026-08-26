"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

type Employee = {
  telegram_id: number;
  telegram_username: string | null;
  first_name: string | null;
  last_name: string | null;
};

type BreakRecord = {
  id: number;
  break_start: string;
  break_end: string | null;
};

type Attendance = {
  id: string;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  employees: Employee | null;
  attendance_breaks: BreakRecord[];
};

function getManilaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

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
  const date = new Date(`${value}T00:00:00+08:00`);

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getEmployeeName(employee: Employee | null) {
  if (!employee) return "Unknown Employee";

  const name = [
    employee.first_name,
    employee.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    name ||
    employee.telegram_username ||
    `Telegram ${employee.telegram_id}`
  );
}

function getEmployeeUsername(employee: Employee | null) {
  if (!employee) return "--";

  if (employee.telegram_username) {
    return `@${employee.telegram_username}`;
  }

  return "--";
}

function isOnBreak(attendance: Attendance) {
  if (attendance.time_out) return false;

  return attendance.attendance_breaks?.some(
    (item) => !item.break_end
  );
}

export default function AdminDashboard() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadAttendance() {
    try {
      setLoading(true);

      const response = await fetch("/api/attendance", {
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success) {
        setAttendance(result.data || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to load attendance:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();

    const interval = setInterval(() => {
      loadAttendance();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const today = getManilaDate();

  const todayAttendance = useMemo(() => {
    return attendance.filter(
      (record) => record.attendance_date === today
    );
  }, [attendance, today]);

  const totalEmployees = useMemo(() => {
    const ids = new Set<number>();

    attendance.forEach((record) => {
      if (record.employees?.telegram_id) {
        ids.add(record.employees.telegram_id);
      }
    });

    return ids.size;
  }, [attendance]);

  const timeInToday = todayAttendance.filter(
    (record) => !!record.time_in
  ).length;

  const onBreakToday = todayAttendance.filter(
    (record) => isOnBreak(record)
  ).length;

  const timeOutToday = todayAttendance.filter(
    (record) => !!record.time_out
  ).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <AdminSidebar />

        {/* MAIN */}
        <main className="flex-1">

          {/* HEADER */}
          <header className="border-b bg-white px-6 py-5 pl-20 md:px-8">

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Dashboard
                </h2>
              </div>

              <div className="text-sm text-gray-500">
                {formatDate(today)}
              </div>

            </div>

          </header>

          {/* CONTENT */}
          <div className="p-6 md:p-8">

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

              {/* EMPLOYEES */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Employees
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {loading ? "..." : totalEmployees}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-100 p-3 text-xl">
                    👥
                  </div>

                </div>

              </div>

              {/* TIME IN */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Time In Today
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {loading ? "..." : timeInToday}
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-100 p-3 text-xl">
                    🟢
                  </div>

                </div>

              </div>

              {/* BREAK */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      On Break
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {loading ? "..." : onBreakToday}
                    </p>
                  </div>

                  <div className="rounded-lg bg-yellow-100 p-3 text-xl">
                    🍴
                  </div>

                </div>

              </div>

              {/* TIME OUT */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Time Out
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {loading ? "..." : timeOutToday}
                    </p>
                  </div>

                  <div className="rounded-lg bg-blue-100 p-3 text-xl">
                    🔵
                  </div>

                </div>

              </div>

            </div>

            {/* TODAY'S ATTENDANCE */}
            <div className="mt-8 overflow-hidden rounded-xl border bg-white shadow-sm">

              <div className="flex flex-col justify-between gap-3 border-b p-6 sm:flex-row sm:items-center">

                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Today&apos;s Attendance
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Employee attendance for today
                  </p>
                </div>

                <div className="text-xs text-gray-400">
                  {lastUpdated
                    ? `Updated ${formatTime(lastUpdated.toISOString())}`
                    : ""}
                </div>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[800px] text-left">

                  <thead className="border-b bg-gray-50">

                    <tr>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Employee
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Time In
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Break
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Time Out
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y">

                    {loading ? (

                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          Loading attendance...
                        </td>
                      </tr>

                    ) : todayAttendance.length === 0 ? (

                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No attendance records for today.
                        </td>
                      </tr>

                    ) : (

                      todayAttendance.map((record) => {

                        const onBreak = isOnBreak(record);
                        const completed = !!record.time_out;

                        const employee = record.employees;
                        const breaks = record.attendance_breaks || [];

                        return (
                          <tr
                            key={record.id}
                            className="hover:bg-gray-50"
                          >

                            {/* EMPLOYEE */}
                            <td className="px-6 py-4">

                              <div className="font-medium text-gray-900">
                                {getEmployeeName(employee)}
                              </div>

                              <div className="mt-1 text-xs text-gray-500">
                                {getEmployeeUsername(employee)}
                              </div>

                            </td>

                            {/* TIME IN */}
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {formatTime(record.time_in)}
                            </td>

                            {/* BREAK */}
                            <td className="px-6 py-4 text-sm text-gray-700">

                              {breaks.length === 0 ? (
                                "--"
                              ) : (
                                <div className="space-y-1">

                                  {breaks.map((item) => (
                                    <div key={item.id}>
                                      {formatTime(item.break_start)}
                                      {" - "}
                                      {item.break_end
                                        ? formatTime(item.break_end)
                                        : "Ongoing"}
                                    </div>
                                  ))}

                                </div>
                              )}

                            </td>

                            {/* TIME OUT */}
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {formatTime(record.time_out)}
                            </td>

                            {/* STATUS */}
                            <td className="px-6 py-4">

                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                  completed
                                    ? "bg-green-100 text-green-700"
                                    : onBreak
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {completed
                                  ? "Completed"
                                  : onBreak
                                    ? "Eating"
                                    : "Working"}
                              </span>

                            </td>

                          </tr>
                        );
                      })

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </main>

      </div>
    </div>
  );
}