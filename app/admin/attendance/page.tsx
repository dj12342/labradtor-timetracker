"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminSidebar from "@/components/AdminSidebar";

const REGULAR_WORK_MINUTES = 8 * 60;

type Employee = {
  telegram_id: number | string;
  telegram_username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type AttendanceBreak = {
  id: string;
  break_start: string;
  break_end?: string | null;
};

type AttendanceRecord = {
  id: string;
  employee_id?: string;
  attendance_date: string;
  time_in?: string | null;
  time_out?: string | null;
  employees?: Employee | null;
  attendance_breaks?: AttendanceBreak[];
};

type BreakForm = {
  id?: string;
  break_start: string;
  break_end: string;
};

type EditForm = {
  time_in: string;
  time_out: string;
  breaks: BreakForm[];
};

function getEmployeeName(record: AttendanceRecord) {
  const employee = record.employees;

  if (!employee) {
    return "Unknown Employee";
  }

  const fullName = [
    employee.first_name,
    employee.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    employee.telegram_username ||
    String(employee.telegram_id)
  );
}

function getEmployeeKey(record: AttendanceRecord) {
  return String(
    record.employees?.telegram_id ||
      record.employee_id ||
      getEmployeeName(record)
  );
}

function formatDate(dateString: string) {
  if (!dateString) return "-";

  const date = new Date(
    `${dateString}T00:00:00+08:00`
  );

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(date);
}

function formatTime(dateString?: string | null) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  }).format(date);
}

function toManilaDateTimeLocal(
  dateString?: string | null
) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }
  ).formatToParts(date);

  const values: Record<string, string> = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function manilaLocalToISO(value: string) {
  if (!value) return null;

  return `${value}:00+08:00`;
}

function getWorkedMinutes(
  record: AttendanceRecord
) {
  if (!record.time_in) {
    return 0;
  }

  const timeIn = new Date(
    record.time_in
  ).getTime();

  const timeOut = record.time_out
    ? new Date(record.time_out).getTime()
    : Date.now();

  if (
    Number.isNaN(timeIn) ||
    Number.isNaN(timeOut) ||
    timeOut <= timeIn
  ) {
    return 0;
  }

  let totalMinutes =
    (timeOut - timeIn) / 60000;

  const breaks =
    record.attendance_breaks || [];

  breaks.forEach((breakItem) => {
    if (!breakItem.break_start) return;

    const breakStart = new Date(
      breakItem.break_start
    ).getTime();

    const breakEnd = breakItem.break_end
      ? new Date(
          breakItem.break_end
        ).getTime()
      : Date.now();

    if (
      !Number.isNaN(breakStart) &&
      !Number.isNaN(breakEnd) &&
      breakEnd > breakStart
    ) {
      totalMinutes -=
        (breakEnd - breakStart) / 60000;
    }
  });

  return Math.max(0, totalMinutes);
}

function getRegularMinutes(
  record: AttendanceRecord
) {
  return Math.min(
    getWorkedMinutes(record),
    REGULAR_WORK_MINUTES
  );
}

function getOTMinutes(
  record: AttendanceRecord
) {
  return Math.max(
    0,
    getWorkedMinutes(record) -
      REGULAR_WORK_MINUTES
  );
}

function minutesToHours(
  minutes: number
) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(
    minutes % 60
  );

  return `${hours}h ${String(
    remainingMinutes
  ).padStart(2, "0")}m`;
}

function minutesToDecimalHours(
  minutes: number
) {
  return (minutes / 60).toFixed(2);
}

function getStatus(
  record: AttendanceRecord
) {
  if (!record.time_in) {
    return "Absent";
  }

  if (!record.time_out) {
    return "Active";
  }

  const worked = getWorkedMinutes(record);

  if (worked > REGULAR_WORK_MINUTES) {
    return "Completed + OT";
  }

  return "Completed";
}

/* ==========================================
   CUTOFF PERIOD
========================================== */

function getCutoffPeriod(
  dateString: string
) {
  const date = new Date(
    `${dateString}T00:00:00+08:00`
  );

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  let startDay = 1;
  let endDay = 15;

  if (day >= 16) {
    startDay = 16;
    endDay = new Date(
      year,
      month + 1,
      0
    ).getDate();
  }

  const startDate = new Date(
    year,
    month,
    startDay
  );

  const endDate = new Date(
    year,
    month,
    endDay
  );

  const formatter = new Intl.DateTimeFormat(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  const monthYear =
    formatter.format(startDate);

  return `${monthYear} ${startDay}–${endDay}, ${year}`;
}

function getCutoffDateRange(
  dateString: string
) {
  const date = new Date(
    `${dateString}T00:00:00+08:00`
  );

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (day <= 15) {
    return {
      start: `${year}-${String(
        month + 1
      ).padStart(2, "0")}-01`,
      end: `${year}-${String(
        month + 1
      ).padStart(2, "0")}-15`,
    };
  }

  const lastDay = new Date(
    year,
    month + 1,
    0
  ).getDate();

  return {
    start: `${year}-${String(
      month + 1
    ).padStart(2, "0")}-16`,
    end: `${year}-${String(
      month + 1
    ).padStart(2, "0")}-${String(
      lastDay
    ).padStart(2, "0")}`,
  };
}

/* ==========================================
   COMPONENT
========================================== */

export default function AttendancePage() {
  const [records, setRecords] = useState<
    AttendanceRecord[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [employeeFilter, setEmployeeFilter] =
    useState("");

  const [dateFilter, setDateFilter] =
    useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editForm, setEditForm] =
    useState<EditForm | null>(null);

  const [saving, setSaving] =
    useState(false);

  /* ==========================================
     LOAD ATTENDANCE
  ========================================== */

  async function loadAttendance() {
    try {
      setError("");

      const response = await fetch(
        "/api/attendance",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Failed to fetch attendance."
        );
      }

      setRecords(result.data || []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  /* ==========================================
     AUTO REFRESH
  ========================================== */

  useEffect(() => {
    if (editingId) return;

    const interval = setInterval(() => {
      loadAttendance();
    }, 30000);

    return () => clearInterval(interval);
  }, [editingId]);

  /* ==========================================
     EMPLOYEE LIST
  ========================================== */

  const employees = useMemo(() => {
    const map = new Map<
      string,
      Employee
    >();

    records.forEach((record) => {
      if (!record.employees) return;

      const key = String(
        record.employees.telegram_id
      );

      if (!map.has(key)) {
        map.set(
          key,
          record.employees
        );
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => {
        const nameA = [
          a.first_name,
          a.last_name,
        ]
          .filter(Boolean)
          .join(" ");

        const nameB = [
          b.first_name,
          b.last_name,
        ]
          .filter(Boolean)
          .join(" ");

        return nameA.localeCompare(
          nameB
        );
      }
    );
  }, [records]);

  /* ==========================================
     FILTERED RECORDS
  ========================================== */

  const filteredRecords = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return records.filter((record) => {
      const employee =
        record.employees;

      const employeeName =
        getEmployeeName(record)
          .toLowerCase();

      const username =
        employee?.telegram_username
          ?.toLowerCase() || "";

      const telegramId = String(
        employee?.telegram_id || ""
      );

      const matchesSearch =
        !searchValue ||
        employeeName.includes(
          searchValue
        ) ||
        username.includes(
          searchValue
        ) ||
        telegramId.includes(
          searchValue
        );

      const matchesEmployee =
        !employeeFilter ||
        String(
          employee?.telegram_id || ""
        ) === employeeFilter;

      const matchesDate =
        !dateFilter ||
        record.attendance_date ===
          dateFilter;

      return (
        matchesSearch &&
        matchesEmployee &&
        matchesDate
      );
    });
  }, [
    records,
    search,
    employeeFilter,
    dateFilter,
  ]);

  /* ==========================================
     EDIT
  ========================================== */

  function startEditing(
    record: AttendanceRecord
  ) {
    setEditingId(record.id);

    setEditForm({
      time_in:
        toManilaDateTimeLocal(
          record.time_in
        ),
      time_out:
        toManilaDateTimeLocal(
          record.time_out
        ),
      breaks: (
        record.attendance_breaks ||
        []
      ).map((breakItem) => ({
        id: breakItem.id,
        break_start:
          toManilaDateTimeLocal(
            breakItem.break_start
          ),
        break_end:
          toManilaDateTimeLocal(
            breakItem.break_end
          ),
      })),
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm(null);
  }

  function addBreak() {
    if (!editForm) return;

    setEditForm({
      ...editForm,
      breaks: [
        ...editForm.breaks,
        {
          break_start: "",
          break_end: "",
        },
      ],
    });
  }

  function removeBreak(index: number) {
    if (!editForm) return;

    const target =
      editForm.breaks[index];

    if (
      target.id &&
      !window.confirm(
        "Delete this break?"
      )
    ) {
      return;
    }

    setEditForm({
      ...editForm,
      breaks: editForm.breaks.filter(
        (_, i) => i !== index
      ),
    });
  }

  function updateBreak(
    index: number,
    field:
      | "break_start"
      | "break_end",
    value: string
  ) {
    if (!editForm) return;

    const breaks = [
      ...editForm.breaks,
    ];

    breaks[index] = {
      ...breaks[index],
      [field]: value,
    };

    setEditForm({
      ...editForm,
      breaks,
    });
  }

  /* ==========================================
     SAVE
  ========================================== */

  async function saveEditing(
    record: AttendanceRecord
  ) {
    if (!editForm) return;

    try {
      setSaving(true);
      setError("");

      if (
        editForm.time_in &&
        editForm.time_out
      ) {
        const timeIn = new Date(
          manilaLocalToISO(
            editForm.time_in
          )!
        ).getTime();

        const timeOut = new Date(
          manilaLocalToISO(
            editForm.time_out
          )!
        ).getTime();

        if (timeOut <= timeIn) {
          throw new Error(
            "Time Out must be later than Time In."
          );
        }
      }

      for (const breakItem of editForm.breaks) {
        if (
          breakItem.break_start &&
          breakItem.break_end
        ) {
          const breakStart =
            new Date(
              manilaLocalToISO(
                breakItem.break_start
              )!
            ).getTime();

          const breakEnd =
            new Date(
              manilaLocalToISO(
                breakItem.break_end
              )!
            ).getTime();

          if (breakEnd <= breakStart) {
            throw new Error(
              "Break End must be later than Break Start."
            );
          }
        }
      }

      /* Update attendance */

      const attendanceResponse =
        await fetch(
          "/api/attendance",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id: record.id,
              time_in:
                editForm.time_in
                  ? manilaLocalToISO(
                      editForm.time_in
                    )
                  : null,
              time_out:
                editForm.time_out
                  ? manilaLocalToISO(
                      editForm.time_out
                    )
                  : null,
            }),
          }
        );

      const attendanceResult =
        await attendanceResponse.json();

      if (
        !attendanceResponse.ok ||
        !attendanceResult.success
      ) {
        throw new Error(
          attendanceResult.error ||
            "Failed to update attendance."
        );
      }

      /* Existing breaks */

      const originalBreaks =
        record.attendance_breaks ||
        [];

      const currentBreakIds =
        editForm.breaks
          .filter((item) => item.id)
          .map((item) => item.id);

      /* Delete removed breaks */

      for (const originalBreak of originalBreaks) {
        if (
          !currentBreakIds.includes(
            originalBreak.id
          )
        ) {
          const response =
            await fetch(
              "/api/attendance/break",
              {
                method: "DELETE",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  id: originalBreak.id,
                }),
              }
            );

          const result =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.error ||
                "Failed to delete break."
            );
          }
        }
      }

      /* Update or create breaks */

      for (const breakItem of editForm.breaks) {
        if (!breakItem.break_start) {
          continue;
        }

        if (breakItem.id) {
          const response =
            await fetch(
              "/api/attendance/break",
              {
                method: "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  id: breakItem.id,
                  break_start:
                    manilaLocalToISO(
                      breakItem.break_start
                    ),
                  break_end:
                    breakItem.break_end
                      ? manilaLocalToISO(
                          breakItem.break_end
                        )
                      : null,
                }),
              }
            );

          const result =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.error ||
                "Failed to update break."
            );
          }
        } else {
          const response =
            await fetch(
              "/api/attendance/break",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  attendance_id:
                    record.id,
                  break_start:
                    manilaLocalToISO(
                      breakItem.break_start
                    ),
                  break_end:
                    breakItem.break_end
                      ? manilaLocalToISO(
                          breakItem.break_end
                        )
                      : null,
                }),
              }
            );

          const result =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.error ||
                "Failed to add break."
            );
          }
        }
      }

      await loadAttendance();

      setEditingId(null);
      setEditForm(null);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save changes."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================
     CSV EXPORT
  ========================================== */

  function exportCSV() {
    if (
      filteredRecords.length === 0
    ) {
      alert(
        "No attendance records to export."
      );
      return;
    }

    const headers = [
      "Employee",
      "Telegram Username",
      "Telegram ID",
      "Date",
      "Time In",
      "Breaks",
      "Time Out",
      "Worked Hours",
      "Regular Hours",
      "OT Hours",
      "Status",
    ];

    const rows =
      filteredRecords.map(
        (record) => {
          const breaks =
            record.attendance_breaks ||
            [];

          const breakText =
            breaks
              .map(
                (breakItem) =>
                  `${formatTime(
                    breakItem.break_start
                  )} - ${formatTime(
                    breakItem.break_end
                  )}`
              )
              .join(" | ");

          return [
            getEmployeeName(record),
            record.employees
              ?.telegram_username ||
              "",
            String(
              record.employees
                ?.telegram_id || ""
            ),
            record.attendance_date,
            formatTime(record.time_in),
            breakText,
            formatTime(record.time_out),
            minutesToDecimalHours(
              getWorkedMinutes(record)
            ),
            minutesToDecimalHours(
              getRegularMinutes(record)
            ),
            minutesToDecimalHours(
              getOTMinutes(record)
            ),
            getStatus(record),
          ];
        }
      );

    const escapeCSV = (
      value: string
    ) => {
      return `"${value
        .replace(/"/g, '""')
        .replace(/\r?\n/g, " ")}"`;
    };

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        row.map(escapeCSV).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "DTR-Export.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /* ==========================================
     PRINT DTR
  ========================================== */

  function handlePrintDTR() {
    if (
      filteredRecords.length === 0
    ) {
      alert(
        "No attendance records to print."
      );
      return;
    }

    window.print();
  }

  /* ==========================================
     GROUP RECORDS FOR PRINT
  ========================================== */

  const printGroups = useMemo(() => {
    const groups = new Map<
      string,
      AttendanceRecord[]
    >();

    filteredRecords.forEach((record) => {
      const key =
        getEmployeeKey(record);

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)!.push(record);
    });

    return Array.from(
      groups.entries()
    ).map(([key, employeeRecords]) => {
      const sortedRecords =
        [...employeeRecords].sort(
          (a, b) =>
            a.attendance_date.localeCompare(
              b.attendance_date
            )
        );

      const firstDate =
        sortedRecords[0]
          ?.attendance_date || "";

      const period =
        firstDate
          ? getCutoffPeriod(firstDate)
          : "-";

      const range =
        firstDate
          ? getCutoffDateRange(firstDate)
          : null;

      return {
        key,
        records: sortedRecords,
        period,
        range,
      };
    });
  }, [filteredRecords]);

  return (
    <>
      <div className="screen-only flex min-h-screen bg-gray-100">
        <AdminSidebar />

        <main className="min-w-0 flex-1 p-6">
          {/* HEADER */}

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Attendance / DTR
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage employee attendance
                and daily time records.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  loadAttendance()
                }
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 0 0-15.5-6.3L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 15.5 6.3L21 16" />
                  <path d="M21 21v-5h-5" />
                </svg>

                Refresh
              </button>

              <button
                type="button"
                onClick={exportCSV}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>

                Export CSV
              </button>

              <button
                type="button"
                onClick={handlePrintDTR}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect
                    x="6"
                    y="14"
                    width="12"
                    height="8"
                  />
                </svg>

                Print DTR
              </button>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* FILTERS */}

          <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Search Employee
                </label>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Name, username, Telegram ID..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-black placeholder:text-gray-400 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Employee
                </label>

                <select
                  value={employeeFilter}
                  onChange={(event) =>
                    setEmployeeFilter(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                >
                  <option value="">
                    All Employees
                  </option>

                  {employees.map(
                    (employee) => {
                      const name = [
                        employee.first_name,
                        employee.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <option
                          key={String(
                            employee.telegram_id
                          )}
                          value={String(
                            employee.telegram_id
                          )}
                        >
                          {name ||
                            employee.telegram_username ||
                            employee.telegram_id}
                        </option>
                      );
                    }
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Date
                </label>

                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) =>
                    setDateFilter(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setEmployeeFilter("");
                    setDateFilter("");
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* INFO */}

          <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="mt-0.5 text-gray-500">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                  />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Overtime Calculation
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Regular work is limited to
                  8 actual working hours.
                  Break time is deducted from
                  the total worked time. Any
                  excess beyond 8 actual
                  working hours is counted as
                  OT.
                </p>
              </div>
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[1250px] w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Employee
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Date
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Time In
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Break
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Time Out
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Worked
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Regular
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      OT
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        Loading attendance...
                      </td>
                    </tr>
                  ) : filteredRecords.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        No attendance records
                        found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(
                      (record) => {
                        const isEditing =
                          editingId ===
                          record.id;

                        return (
                          <tr
                            key={record.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            {/* EMPLOYEE */}

                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">
                                {getEmployeeName(
                                  record
                                )}
                              </div>

                              {record
                                .employees
                                ?.telegram_username && (
                                <div className="text-xs text-gray-500">
                                  @
                                  {
                                    record
                                      .employees
                                      .telegram_username
                                  }
                                </div>
                              )}
                            </td>

                            {/* DATE */}

                            <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                              {formatDate(
                                record.attendance_date
                              )}
                            </td>

                            {/* TIME IN */}

                            <td className="px-4 py-3">
                              {isEditing &&
                              editForm ? (
                                <input
                                  type="datetime-local"
                                  value={
                                    editForm.time_in
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setEditForm(
                                      {
                                        ...editForm,
                                        time_in:
                                          event
                                            .target
                                            .value,
                                      }
                                    )
                                  }
                                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-black outline-none focus:border-gray-500"
                                />
                              ) : (
                                <span className="text-gray-700">
                                  {formatTime(
                                    record.time_in
                                  )}
                                </span>
                              )}
                            </td>

                            {/* BREAK */}

                            <td className="px-4 py-3">
                              {isEditing &&
                              editForm ? (
                                <div className="min-w-[280px] space-y-2">
                                  {editForm.breaks
                                    .length ===
                                    0 && (
                                    <p className="text-xs text-gray-400">
                                      No break
                                      recorded
                                    </p>
                                  )}

                                  {editForm.breaks.map(
                                    (
                                      breakItem,
                                      index
                                    ) => (
                                      <div
                                        key={
                                          breakItem.id ||
                                          `new-${index}`
                                        }
                                        className="flex items-center gap-2"
                                      >
                                        <input
                                          type="datetime-local"
                                          value={
                                            breakItem.break_start
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            updateBreak(
                                              index,
                                              "break_start",
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          className="w-[145px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-black"
                                        />

                                        <span className="text-gray-400">
                                          -
                                        </span>

                                        <input
                                          type="datetime-local"
                                          value={
                                            breakItem.break_end
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            updateBreak(
                                              index,
                                              "break_end",
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          className="w-[145px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-black"
                                        />

                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeBreak(
                                              index
                                            )
                                          }
                                          className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    )
                                  )}

                                  <button
                                    type="button"
                                    onClick={
                                      addBreak
                                    }
                                    className="text-xs font-medium text-gray-700 underline underline-offset-2 hover:text-black"
                                  >
                                    + Add Break
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {(
                                    record.attendance_breaks ||
                                    []
                                  ).length ===
                                  0 ? (
                                    <span className="text-gray-400">
                                      -
                                    </span>
                                  ) : (
                                    (
                                      record.attendance_breaks ||
                                      []
                                    ).map(
                                      (
                                        breakItem
                                      ) => (
                                        <div
                                          key={
                                            breakItem.id
                                          }
                                          className="whitespace-nowrap text-xs text-gray-700"
                                        >
                                          {formatTime(
                                            breakItem.break_start
                                          )}{" "}
                                          -{" "}
                                          {formatTime(
                                            breakItem.break_end
                                          )}
                                        </div>
                                      )
                                    )
                                  )}
                                </div>
                              )}
                            </td>

                            {/* TIME OUT */}

                            <td className="px-4 py-3">
                              {isEditing &&
                              editForm ? (
                                <input
                                  type="datetime-local"
                                  value={
                                    editForm.time_out
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setEditForm(
                                      {
                                        ...editForm,
                                        time_out:
                                          event
                                            .target
                                            .value,
                                      }
                                    )
                                  }
                                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-black outline-none focus:border-gray-500"
                                />
                              ) : (
                                <span className="text-gray-700">
                                  {formatTime(
                                    record.time_out
                                  )}
                                </span>
                              )}
                            </td>

                            {/* WORKED */}

                            <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                              {minutesToHours(
                                getWorkedMinutes(
                                  record
                                )
                              )}
                            </td>

                            {/* REGULAR */}

                            <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                              {minutesToHours(
                                getRegularMinutes(
                                  record
                                )
                              )}
                            </td>

                            {/* OT */}

                            <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                              {minutesToHours(
                                getOTMinutes(
                                  record
                                )
                              )}
                            </td>

                            {/* STATUS */}

                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                  getStatus(
                                    record
                                  ) ===
                                  "Active"
                                    ? "bg-gray-900 text-white"
                                    : getStatus(
                                        record
                                      ) ===
                                      "Completed + OT"
                                    ? "bg-gray-200 text-gray-900"
                                    : getStatus(
                                        record
                                      ) ===
                                      "Completed"
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {getStatus(
                                  record
                                )}
                              </span>
                            </td>

                            {/* ACTIONS */}

                            <td className="px-4 py-3 text-right">
                              {isEditing ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    disabled={
                                      saving
                                    }
                                    onClick={() =>
                                      saveEditing(
                                        record
                                      )
                                    }
                                    className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                  >
                                    {saving
                                      ? "Saving..."
                                      : "Save"}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      saving
                                    }
                                    onClick={
                                      cancelEditing
                                    }
                                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    startEditing(
                                      record
                                    )
                                  }
                                  className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                  title="Edit attendance"
                                >
                                  <svg
                                    width="17"
                                    height="17"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                  </svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER */}

            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-800">
                {filteredRecords.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-800">
                {records.length}
              </span>{" "}
              attendance records
            </div>
          </div>
        </main>
      </div>

      {/* ==========================================
          PRINT DTR
      ========================================== */}

      <div className="print-only">
        {printGroups.map((group) => {
          const firstRecord =
            group.records[0];

          const employee =
            firstRecord?.employees;

          const totalWorked =
            group.records.reduce(
              (total, record) =>
                total +
                getWorkedMinutes(record),
              0
            );

          const totalRegular =
            group.records.reduce(
              (total, record) =>
                total +
                getRegularMinutes(record),
              0
            );

          const totalOT =
            group.records.reduce(
              (total, record) =>
                total +
                getOTMinutes(record),
              0
            );

          return (
            <section
              key={group.key}
              className="dtr-page"
            >
              <div className="dtr-header">
                <div className="dtr-company">
                  LABRADOR
                </div>

                <h1>
                  DAILY TIME RECORD
                </h1>

                <p className="dtr-period">
                  Period:{" "}
                  <strong>
                    {group.period}
                  </strong>
                </p>
              </div>

              <div className="dtr-employee-info">
                <div>
                  <span>
                    Employee Name:
                  </span>

                  <strong>
                    {getEmployeeName(
                      firstRecord
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Employee ID:
                  </span>

                  <strong>
                    {employee?.telegram_id ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Telegram Username:
                  </span>

                  <strong>
                    {employee
                      ?.telegram_username
                      ? `@${employee.telegram_username}`
                      : "-"}
                  </strong>
                </div>
              </div>

              <table className="dtr-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>TIME IN</th>
                    <th>BREAK / BREAKS</th>
                    <th>TIME OUT</th>
                    <th>WORKED</th>
                    <th>REGULAR</th>
                    <th>OT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {group.records.map(
                    (record) => {
                      const breaks =
                        record.attendance_breaks ||
                        [];

                      return (
                        <tr
                          key={record.id}
                        >
                          <td>
                            {formatDate(
                              record.attendance_date
                            )}
                          </td>

                          <td>
                            {formatTime(
                              record.time_in
                            )}
                          </td>

                          <td>
                            {breaks.length ===
                            0 ? (
                              "-"
                            ) : (
                              <div className="print-breaks">
                                {breaks.map(
                                  (
                                    breakItem
                                  ) => (
                                    <div
                                      key={
                                        breakItem.id
                                      }
                                    >
                                      {formatTime(
                                        breakItem.break_start
                                      )}{" "}
                                      -{" "}
                                      {formatTime(
                                        breakItem.break_end
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </td>

                          <td>
                            {formatTime(
                              record.time_out
                            )}
                          </td>

                          <td>
                            {minutesToHours(
                              getWorkedMinutes(
                                record
                              )
                            )}
                          </td>

                          <td>
                            {minutesToHours(
                              getRegularMinutes(
                                record
                              )
                            )}
                          </td>

                          <td>
                            {minutesToHours(
                              getOTMinutes(
                                record
                              )
                            )}
                          </td>

                          <td>
                            {getStatus(
                              record
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>

                <tfoot>
                  <tr>
                    <td
                      colSpan={4}
                      className="dtr-total-label"
                    >
                      TOTAL
                    </td>

                    <td>
                      {minutesToHours(
                        totalWorked
                      )}
                    </td>

                    <td>
                      {minutesToHours(
                        totalRegular
                      )}
                    </td>

                    <td>
                      {minutesToHours(
                        totalOT
                      )}
                    </td>

                    <td></td>
                  </tr>
                </tfoot>
              </table>

              <div className="dtr-summary">
                <div>
                  <strong>
                    Total Regular Hours:
                  </strong>{" "}
                  {minutesToHours(
                    totalRegular
                  )}
                </div>

                <div>
                  <strong>
                    Total OT Hours:
                  </strong>{" "}
                  {minutesToHours(
                    totalOT
                  )}
                </div>
              </div>

              <div className="dtr-signatures">
                <div className="dtr-signature">
                  <div className="signature-line"></div>

                  <strong>
                    Employee Signature
                  </strong>

                  <span>
                    Date Signed: ____________
                  </span>
                </div>

                <div className="dtr-signature">
                  <div className="signature-line"></div>

                  <strong>
                    Admin / HR Signature
                  </strong>

                  <span>
                    Date Signed: ____________
                  </span>
                </div>
              </div>

              <div className="dtr-footer">
                <span>
                  Generated from Labrador
                  TimeTrack
                </span>

                <span>
                  Period:{" "}
                  {group.period}
                </span>
              </div>
            </section>
          );
        })}
      </div>

      {/* ==========================================
          PRINT CSS
      ========================================== */}

      <style jsx global>{`
        .print-only {
          display: none;
        }

        @media print {
          @page {
            size: landscape;
            margin: 10mm;
          }

          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body {
            color: #000 !important;
          }

          .screen-only {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          .dtr-page {
            width: 100%;
            min-height: 180mm;
            position: relative;
            page-break-after: always;
            break-after: page;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            color: #000;
          }

          .dtr-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .dtr-header {
            text-align: center;
            margin-bottom: 14px;
          }

          .dtr-company {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 3px;
          }

          .dtr-header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .dtr-period {
            margin: 5px 0 0;
            font-size: 11px;
          }

          .dtr-employee-info {
            display: grid;
            grid-template-columns:
              1.5fr
              1fr
              1.5fr;
            gap: 12px;
            border: 1px solid #000;
            padding: 8px 10px;
            margin-bottom: 12px;
            font-size: 10px;
          }

          .dtr-employee-info div {
            display: flex;
            gap: 5px;
            align-items: baseline;
          }

          .dtr-employee-info span {
            font-weight: 400;
          }

          .dtr-employee-info strong {
            font-weight: 700;
          }

          .dtr-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 9px;
          }

          .dtr-table th,
          .dtr-table td {
            border: 1px solid #000;
            padding: 6px 5px;
            text-align: center;
            vertical-align: middle;
          }

          .dtr-table th {
            background: #f2f2f2 !important;
            font-weight: 700;
          }

          .dtr-table th:nth-child(1) {
            width: 13%;
          }

          .dtr-table th:nth-child(2) {
            width: 12%;
          }

          .dtr-table th:nth-child(3) {
            width: 19%;
          }

          .dtr-table th:nth-child(4) {
            width: 12%;
          }

          .dtr-table th:nth-child(5) {
            width: 11%;
          }

          .dtr-table th:nth-child(6) {
            width: 11%;
          }

          .dtr-table th:nth-child(7) {
            width: 10%;
          }

          .dtr-table th:nth-child(8) {
            width: 12%;
          }

          .print-breaks {
            line-height: 1.4;
          }

          .dtr-table tfoot td {
            font-weight: 700;
            background: #f2f2f2 !important;
          }

          .dtr-total-label {
            text-align: right !important;
          }

          .dtr-summary {
            display: flex;
            justify-content: flex-end;
            gap: 25px;
            margin-top: 10px;
            font-size: 10px;
          }

          .dtr-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 100px;
            margin-top: 45px;
            padding: 0 40px;
          }

          .dtr-signature {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            font-size: 10px;
          }

          .signature-line {
            width: 230px;
            border-bottom: 1px solid #000;
            height: 25px;
            margin-bottom: 5px;
          }

          .dtr-signature span {
            margin-top: 3px;
            font-size: 9px;
          }

          .dtr-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #000;
            padding-top: 5px;
            font-size: 8px;
          }
        }
      `}</style>
    </>
  );
}