"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Invalid username or password."
        );
      }

      localStorage.setItem(
        "threatlens_access_token",
        data.access_token
      );

      localStorage.setItem(
        "threatlens_user",
        JSON.stringify(data.user)
      );

      router.push("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">

      <div className="w-full max-w-md">

        {/* Logo */}

        <div className="mb-8 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
            <ShieldCheck
              size={28}
              className="text-blue-400"
            />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-white">
            ThreatLens <span className="text-blue-400">AI</span>
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Enterprise Threat Intelligence Platform
          </p>

        </div>

        {/* Login Card */}

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">

          <div className="mb-6">

            <h2 className="text-lg font-semibold text-white">
              Sign in
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Access the ThreatLens security console.
            </p>

          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* Username */}

            <div>

              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Enter username"
                required
                minLength={3}
                autoComplete="username"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />

            </div>

            {/* Password */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <div className="relative">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter password"
                  required
                  minLength={8}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>

            {/* Error */}

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading && (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Signing in..."
                : "Sign in"}

            </button>

          </form>

          {/* Register */}

          <div className="mt-6 border-t border-slate-800 pt-5 text-center">

            <p className="text-sm text-slate-500">
              Don't have an account?
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/register")
              }
              className="mt-1 text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Create an account
            </button>

          </div>

        </div>

        {/* Footer */}

        <p className="mt-6 text-center text-xs text-slate-600">
          ThreatLens AI • Security Operations Center
        </p>

      </div>

    </main>
  );
}