"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  ShieldAlert,
  Database,
  Activity,
  Settings,
  ChevronLeft,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "IOC Intelligence",
    href: "/iocs",
    icon: Search,
  },
  {
    label: "Threat Feed",
    href: "/threat-feed",
    icon: Database,
  },
  {
    label: "Threat Analysis",
    href: "/threat-analysis",
    icon: ShieldAlert,
  },
  {
    label: "Correlation",
    href: "/correlation",
    icon: Activity,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 md:flex md:flex-col">

      {/* =====================================================
          LOGO
      ====================================================== */}

      <div className="flex h-16 items-center border-b border-slate-800 px-6">
        <Link href="/" className="block">
          <h1 className="text-lg font-semibold text-white">
            ThreatLens{" "}
            <span className="text-blue-400">AI</span>
          </h1>

          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Threat Intelligence
          </p>
        </Link>
      </div>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <nav className="flex-1 space-y-1 p-4">

        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                active
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
              }`}
            >
              <Icon
                size={17}
                strokeWidth={1.8}
                className={
                  active
                    ? "text-blue-400"
                    : "text-slate-500 group-hover:text-slate-300"
                }
              />

              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Divider */}

        <div className="my-4 border-t border-slate-800" />

        {/* =================================================
            SETTINGS
        ================================================== */}

        <Link
          href="/settings"
          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150 ${
            pathname.startsWith("/settings")
              ? "bg-blue-500/10 text-blue-400"
              : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
          }`}
        >
          <Settings
            size={17}
            strokeWidth={1.8}
            className={
              pathname.startsWith("/settings")
                ? "text-blue-400"
                : "text-slate-500 group-hover:text-slate-300"
            }
          />

          <span>Settings</span>
        </Link>

      </nav>

      {/* =====================================================
          SYSTEM STATUS
      ====================================================== */}

      <div className="border-t border-slate-800 p-4">

        <div className="rounded-lg bg-slate-900 p-3">

          <p className="text-xs font-medium text-slate-400">
            SYSTEM STATUS
          </p>

          <div className="mt-2 flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-xs text-emerald-400">
              All systems operational
            </span>

          </div>

        </div>

      </div>

      {/* =====================================================
          COLLAPSE BUTTON
      ====================================================== */}

      <div className="border-t border-slate-800 p-3">

        <button
          type="button"
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-600 transition hover:bg-slate-900 hover:text-slate-400"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={17} />
        </button>

      </div>

    </aside>
  );
}