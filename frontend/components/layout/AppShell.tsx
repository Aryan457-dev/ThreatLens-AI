"use client";

import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";
import Header from "./Header";
import AuthGuard from "./AuthGuard";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register";

  return (
    <AuthGuard>
      {isAuthPage ? (
        children
      ) : (
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <Header />

            <main className="min-w-0 flex-1">
              {children}
            </main>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}