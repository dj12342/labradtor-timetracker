"use client";

import AdminSidebar from "@/components/AdminSidebar";

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">

        <AdminSidebar />

        <main className="flex-1">

        
          <header className="border-b bg-white px-6 py-5 pl-20 md:px-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Reports
            </h2>
          </header>

    
          <div className="flex min-h-[calc(100vh-89px)] items-center justify-center p-6 md:p-8">

            <div className="text-center">

          
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
                <svg
                  className="h-12 w-12 animate-spin text-gray-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                  />

                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.35a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.63h.03A1.7 1.7 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.65a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.37 9v.03A1.7 1.7 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-900">
                Ongoing Building
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                The Reports module is currently under development.
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Please check back soon.
              </p>

            </div>

          </div>

        </main>

      </div>
    </div>
  );
}