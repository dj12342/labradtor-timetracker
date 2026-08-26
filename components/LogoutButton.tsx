"use client";

import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function LogoutButton() {
  const supabase = createSupabaseBrowser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full rounded-lg px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition"
    >
      Logout
    </button>
  );
}