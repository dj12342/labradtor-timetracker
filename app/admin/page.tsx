import LogoutButton from "@/components/LogoutButton";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r flex flex-col">

  {/* LOGO / BRAND */}
  <div className="p-6 border-b">
    <h1 className="text-xl font-bold text-gray-900">
      Labrador
    </h1>

    <p className="text-sm text-gray-500">
      TimeTrack
    </p>
  </div>

  {/* NAVIGATION */}
  <nav className="flex-1 p-4 space-y-2">

    <a
      href="/admin"
      className="block rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white"
    >
      Dashboard
    </a>

    <a
      href="/admin/attendance"
      className="block rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
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

  {/* ADMIN / LOGOUT */}
  <div className="border-t p-4">

    <p className="mb-2 px-4 text-xs text-gray-500">
      Administrator
    </p>

    <LogoutButton />

  </div>

</aside>

        {/* MAIN */}
        <main className="flex-1">

          <header className="bg-white border-b px-8 py-5">
            <h2 className="text-2xl font-bold text-gray-900">
              Dashboard
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Labrador TimeTrack Attendance System
            </p>
          </header>

          <div className="p-8">

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              <div className="bg-white rounded-xl border p-6">
                <p className="text-sm text-gray-500">
                  Employees
                </p>

                <p className="text-3xl font-bold mt-2">
                  0
                </p>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <p className="text-sm text-gray-500">
                  Time In Today
                </p>

                <p className="text-3xl font-bold mt-2">
                  0
                </p>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <p className="text-sm text-gray-500">
                  On Break
                </p>

                <p className="text-3xl font-bold mt-2">
                  0
                </p>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <p className="text-sm text-gray-500">
                  Time Out
                </p>

                <p className="text-3xl font-bold mt-2">
                  0
                </p>
              </div>

            </div>

            {/* RECENT ATTENDANCE */}
            <div className="mt-8 bg-white rounded-xl border">

              <div className="p-6 border-b">
                <h3 className="font-semibold text-lg">
                  Recent Attendance
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Latest attendance activity
                </p>
              </div>

              <div className="p-8 text-center text-gray-500">
                No attendance records yet.
              </div>

            </div>

          </div>

        </main>

      </div>
    </div>
  );
}