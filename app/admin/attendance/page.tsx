"use client";

import { useEffect, useState } from "react";

type AttendanceLog = {
  id: number;
  telegram_id: string;
  telegram_username: string | null;
  full_name: string;
  action: "TIME_IN" | "BREAK" | "RESUME" | "TIME_OUT";
  recorded_at: string;
};

export default function AttendancePage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadAttendance() {
    try {
      setLoading(true);

      const response = await fetch("/api/attendance");
      const result = await response.json();

      if (result.success) {
        setLogs(result.data);
      }
    } catch (error) {
      console.error("Failed to load attendance:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  const filteredLogs = logs.filter((log) =>
    log.full_name.toLowerCase().includes(search.toLowerCase())
  );

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function actionLabel(action: string) {
    switch (action) {
      case "TIME_IN":
        return "Time In";

      case "BREAK":
        return "Break";

      case "RESUME":
        return "Resume";

      case "TIME_OUT":
        return "Time Out";

      default:
        return action;
    }
  }

  function actionClass(action: string) {
    switch (action) {
      case "TIME_IN":
        return "bg-green-100 text-green-700";

      case "BREAK":
        return "bg-yellow-100 text-yellow-700";

      case "RESUME":
        return "bg-blue-100 text-blue-700";

      case "TIME_OUT":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="w-64 bg-white border-r">

          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">
              Labrador
            </h1>

            <p className="text-sm text-gray-500">
              TimeTrack
            </p>
          </div>

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
              Attendance Logs
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
              Attendance Logs
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              View employee attendance activity
            </p>

          </header>

          {/* CONTENT */}

          <div className="p-8">

            {/* SEARCH */}

            <div className="mb-6">

              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-md rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-300"
              />

            </div>

            {/* TABLE */}

            <div className="overflow-hidden rounded-xl border bg-white">

              <div className="overflow-x-auto">

                <table className="w-full text-left">

                  <thead className="border-b bg-gray-50">

                    <tr>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Employee
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Action
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Time
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Date
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Telegram
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {loading ? (

                      <tr>

                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          Loading attendance...
                        </td>

                      </tr>

                    ) : filteredLogs.length === 0 ? (

                      <tr>

                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No attendance records found.
                        </td>

                      </tr>

                    ) : (

                      filteredLogs.map((log) => (

                        <tr
                          key={log.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >

                          <td className="px-6 py-4">

                            <div className="font-medium text-gray-900">
                              {log.full_name}
                            </div>

                          </td>

                          <td className="px-6 py-4">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${actionClass(
                                log.action
                              )}`}
                            >
                              {actionLabel(log.action)}
                            </span>

                          </td>

                          <td className="px-6 py-4 text-sm text-gray-700">
                            {formatTime(log.recorded_at)}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-700">
                            {formatDate(log.recorded_at)}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-500">

                            {log.telegram_username
                              ? `@${log.telegram_username}`
                              : log.telegram_id}

                          </td>

                        </tr>

                      ))

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