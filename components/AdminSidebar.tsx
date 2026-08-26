"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isDashboard = pathname === "/admin";
  const isAttendance = pathname.startsWith("/admin/attendance");
  const isEmployees = pathname.startsWith("/admin/employees");
  const isReports = pathname.startsWith("/admin/reports");

  return (
    <aside
      className={`hidden flex-col border-r bg-white transition-all duration-300 md:flex ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* BRAND */}
      <div
        className={`flex items-center border-b ${
          collapsed
            ? "justify-center p-5"
            : "justify-between p-6"
        }`}
      >
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Labrador
            </h1>

            <p className="text-sm text-gray-500">
              DTR
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
          title={collapsed ? "Open sidebar" : "Close sidebar"}
        >
          {collapsed ? "☰" : "←"}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-2 p-4">

        {/* DASHBOARD */}
        <a
          href="/admin"
          title="Dashboard"
          className={`flex items-center rounded-lg py-3 text-sm font-medium transition ${
            collapsed
              ? "justify-center px-0"
              : "px-4"
          } ${
            isDashboard
              ? "bg-green-600 text-white hover:bg-green-700"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="text-lg">▦</span>

          {!collapsed && (
            <span className="ml-3">
              Dashboard
            </span>
          )}
        </a>

        {/* ATTENDANCE */}
        <a
          href="/admin/attendance"
          title="Attendance"
          className={`flex items-center rounded-lg py-3 text-sm font-medium transition ${
            collapsed
              ? "justify-center px-0"
              : "px-4"
          } ${
            isAttendance
              ? "bg-green-600 text-white hover:bg-green-700"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="text-lg">◷</span>

          {!collapsed && (
            <span className="ml-3">
              Attendance
            </span>
          )}
        </a>

        {/* EMPLOYEES */}
        <a
          href="/admin/employees"
          title="Employees"
          className={`flex items-center rounded-lg py-3 text-sm font-medium transition ${
            collapsed
              ? "justify-center px-0"
              : "px-4"
          } ${
            isEmployees
              ? "bg-green-600 text-white hover:bg-green-700"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="text-lg">♙</span>

          {!collapsed && (
            <span className="ml-3">
              Employees
            </span>
          )}
        </a>

        {/* REPORTS */}
        <a
          href="/admin/reports"
          title="Reports"
          className={`flex items-center rounded-lg py-3 text-sm font-medium transition ${
            collapsed
              ? "justify-center px-0"
              : "px-4"
          } ${
            isReports
              ? "bg-green-600 text-white hover:bg-green-700"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="text-lg">▤</span>

          {!collapsed && (
            <span className="ml-3">
              Reports
            </span>
          )}
        </a>

      </nav>

      {/* LOGOUT */}
      <div className="border-t p-4">
        <div
          className={`${
            collapsed
              ? "[&>button]:!justify-center [&>button]:!px-0"
              : ""
          }`}
        >
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}