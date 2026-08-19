"use client";

import {
  Bell,
  Search,
  ShieldCheck,
  LogOut,
} from "lucide-react";

import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("threatlens_access_token");
    localStorage.removeItem("threatlens_user");

    router.push("/login");
  };

  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-6">

      {/* Search */}
      <div className="flex w-full max-w-md items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
        <Search
          size={17}
          className="shrink-0 text-slate-500"
        />

        <input
          type="text"
          placeholder="Search IOC, IP, domain..."
          className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
        />
      </div>

      {/* Right */}
      <div className="ml-6 flex shrink-0 items-center gap-5">

        {/* System Status */}
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <ShieldCheck size={16} />
          <span>Systems Operational</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative text-slate-400 transition hover:text-slate-200"
          aria-label="Notifications"
        >
          <Bell size={19} />

          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>

      </div>
    </header>
  );
}