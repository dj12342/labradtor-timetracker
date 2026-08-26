"use client";

import { useEffect, useState } from "react";

type Employee = {
  telegram_id: number;
  telegram_username: string | null;
  first_name: string | null;
  last_name: string | null;
};

type AttendanceBreak = {
  id: string;
  break_start: string;
  break_end: string | null;
};

type AttendanceRecord = {
  id: string;
  employee_id: string;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  created_at: string;
  updated_at: string;
  employees: Employee;
  attendance_breaks: AttendanceBreak[];
};

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadAttendance() {
    try {
      setLoading(true);

      const response = await fetch("/api/attendance", {
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success) {
        setRecords(result.data || []);
      } else {
        console.error("Attendance API error:", result.error);
        setRecords([]);
      }
    } catch (error) {
      console.error("Failed to load attendance:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  function getEmployeeName(employee: Employee) {
    const name = [
      employee.first_name,
      employee.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return name || "Unknown Employee";
  }

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00+08:00`).toLocaleDateString(
      "en-PH",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  function formatTime(date: string | null) {
    if (!date) {
      return "--";
    }

    return new Date(date).toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function getStatus(record: AttendanceRecord) {
    if (record.time_out) {
      return {
        label: "Complete",
        className: "bg-green-100 text-green-700",
      };
    }

    if (record.time_in) {
      return {
        label: "In Progress",
        className: "bg-blue-100 text-blue-700",
      };
    }

    return {
      label: "Not Started",
      className: "bg-gray-100 text-gray-700",
    };
  }

  const filteredRecords = records.filter((record) => {
    const employee = record.employees;

    const name = getEmployeeName(employee).toLowerCase();

    const username =
      employee.telegram_username?.toLowerCase() || "";

    const telegramId =
      employee.telegram_id?.toString() || "";

    const query = search.toLowerCase();

    return (
      name.includes(query) ||
      username.includes(query) ||
      telegramId.includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="w-64 bg-white border-r">

          {/* BRAND */}

          <div className="p-6 border-b">

            <h1 className="text-xl font-bold text-gray-900">
              Labrador
            </h1>

            <p className="text-sm text-gray-500">
              TimeTrack
            </p>

          </div>

          {/* NAVIGATION */}

          <nav className="p-4 space-y-2">

            <a
              href="/admin"
              className="block rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </a>

            <a
              href="/admin/attendance"
              className="block rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white"
            >
              Attendance
            </a>

            <a
              href="/admin/employees"
              className="block rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
            >
              Employees
            </a>

            <a
              href="/admin/reports"
              className="block rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
            >
              Reports
            </a>

          </nav>

        </aside>

        {/* MAIN */}

        <main className="flex-1">

          {/* HEADER */}

          <header className="bg-white border-b px-8 py-5">

            <h2 className="text-2xl font-bold text-gray-900">
              Attendance
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Daily employee attendance records
            </p>

          </header>

          {/* CONTENT */}

          <div className="p-8">

            {/* TOP BAR */}

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <h3 className="text-lg font-semibold text-gray-900">
                  Attendance Records
                </h3>

                <p className="text-sm text-gray-500">
                  {records.length} attendance record
                  {records.length !== 1 ? "s" : ""}
                </p>

              </div>

              <button
                onClick={loadAttendance}
                disabled={loading}
                className="rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

            </div>

            {/* SEARCH */}

            <div className="mb-6">

              <input
                type="text"
                placeholder="Search employee, username, or Telegram ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-lg rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-300"
              />

            </div>

            {/* TABLE */}

            <div className="overflow-hidden rounded-xl border bg-white">

              <div className="overflow-x-auto">

                <table className="w-full text-left">

                  <thead className="border-b bg-gray-50">

                    <tr>

                      <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700">
                        Employee
                      </th>

                      <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700">
                        Telegram
                      </th>

                      <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700">
                        Date
                      </th>

                      <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700">
                        Time In
                      </th>

                      <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700">
                        Breaks
                      </th>

                      <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700">
                        Time Out
                      </th>

                      <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {loading ? (

                      <tr>

                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          Loading attendance records...
                        </td>

                      </tr>

                    ) : filteredRecords.length === 0 ? (

                      <tr>

                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          {search
                            ? "No matching attendance records found."
                            : "No attendance records found."}
                        </td>

                      </tr>

                    ) : (

                      filteredRecords.map((record) => {

                        const status = getStatus(record);

                        const employeeName =
                          getEmployeeName(record.employees);

                        const username =
                          record.employees.telegram_username;

                        return (

                          <tr
                            key={record.id}
                            className="border-b last:border-0 hover:bg-gray-50"
                          >

                            {/* EMPLOYEE */}

                            <td className="px-6 py-4">

                              <div className="font-medium text-gray-900">
                                {employeeName}
                              </div>

                            </td>

                            {/* TELEGRAM */}

                            <td className="px-6 py-4">

                              <div className="text-sm text-gray-700">

                                {username
                                  ? `@${username}`
                                  : "No username"}

                              </div>

                              <div className="text-xs text-gray-400">
                                ID: {record.employees.telegram_id}
                              </div>

                            </td>

                            {/* DATE */}

                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">

                              {formatDate(
                                record.attendance_date
                              )}

                            </td>

                            {/* TIME IN */}

                            <td className="whitespace-nowrap px-6 py-4">

                              {record.time_in ? (

                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                  {formatTime(record.time_in)}
                                </span>

                              ) : (

                                <span className="text-sm text-gray-400">
                                  --
                                </span>

                              )}

                            </td>

                            {/* BREAKS */}

                            <td className="px-6 py-4">

                              {record.attendance_breaks.length ===
                              0 ? (

                                <span className="text-sm text-gray-400">
                                  None
                                </span>

                              ) : (

                                <div className="space-y-1">

                                  <div className="text-sm font-medium text-gray-700">
                                    {
                                      record.attendance_breaks
                                        .length
                                    }{" "}
                                    break
                                    {record.attendance_breaks
                                      .length !== 1
                                      ? "s"
                                      : ""}
                                  </div>

                                  <div className="text-xs text-gray-500">

                                    {record.attendance_breaks.map(
                                      (item, index) => (

                                        <div key={item.id}>

                                          Break {index + 1}:{" "}
                                          {formatTime(
                                            item.break_start
                                          )}{" "}
                                          -{" "}
                                          {item.break_end
                                            ? formatTime(
                                                item.break_end
                                              )
                                            : "Ongoing"}

                                        </div>

                                      )
                                    )}

                                  </div>

                                </div>

                              )}

                            </td>

                            {/* TIME OUT */}

                            <td className="whitespace-nowrap px-6 py-4">

                              {record.time_out ? (

                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                                  {formatTime(record.time_out)}
                                </span>

                              ) : (

                                <span className="text-sm text-gray-400">
                                  --
                                </span>

                              )}

                            </td>

                            {/* STATUS */}

                            <td className="px-6 py-4">

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                              >
                                {status.label}
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