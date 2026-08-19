"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  getToken,
  removeToken,
} from "../../src/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api/v1";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [checking, setChecking] = useState(true);

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register";

  useEffect(() => {
    if (isAuthPage) {
      setChecking(false);
      return;
    }

    async function validateSession() {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          removeToken();
          localStorage.removeItem(
            "threatlens_user"
          );

          router.replace("/login");
          return;
        }

        setChecking(false);
      } catch {
        removeToken();
        localStorage.removeItem(
          "threatlens_user"
        );

        router.replace("/login");
      }
    }

    validateSession();
  }, [isAuthPage, pathname, router]);

  if (checking && !isAuthPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

          <p className="mt-4 text-sm text-slate-500">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}