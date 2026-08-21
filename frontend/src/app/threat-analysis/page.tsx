"use client";

import { useState } from "react";
import {
  AlertCircle,
  Loader2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

import { api } from "../../lib/api";

type AnalysisResult = {
  ip: string;
  threat_score: number;
  threat_level: string;

  abuseipdb?: {
    confidence_score: number;
    total_reports: number;
  };

  virustotal?: {
    malicious: number;
    suspicious: number;
    harmless: number;
  };

  analysis?: {
    risk_factors: string[];
    summary: string;
  };
};

export default function ThreatAnalysisPage() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // ANALYZE IP
  // ============================================================

  async function analyzeIP(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanIP = ip.trim();

    if (!cleanIP) {
      setError("Please enter an IP address.");
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      /*
       * Central API client automatically attaches:
       *
       * Authorization: Bearer <JWT>
       *
       * Backend endpoint:
       * POST /api/v1/threat-analysis/{ip}/analyze
       */

      const data = await api.post(
        `/api/v1/threat-analysis/${encodeURIComponent(
          cleanIP
        )}/analyze`
      );

      console.log("Threat analysis response:", data);

      setResult(data as AnalysisResult);
    } catch (err) {
      console.error("Threat analysis error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to perform threat analysis."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // THREAT LEVEL
  // ============================================================

  const threatLevel =
    result?.threat_level?.toUpperCase() || "";

  const getThreatColor = () => {
    switch (threatLevel) {
      case "CRITICAL":
        return "text-red-400";

      case "HIGH":
        return "text-orange-400";

      case "MEDIUM":
        return "text-yellow-400";

      case "LOW":
        return "text-emerald-400";

      default:
        return "text-slate-400";
    }
  };

  const getThreatBadge = () => {
    switch (threatLevel) {
      case "CRITICAL":
        return "border-red-500/30 bg-red-500/10 text-red-400";

      case "HIGH":
        return "border-orange-500/30 bg-orange-500/10 text-orange-400";

      case "MEDIUM":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

      case "LOW":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

      default:
        return "border-slate-700 bg-slate-900 text-slate-400";
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-full bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-[1600px] p-6">

        {/* ======================================================
            HEADER
        ======================================================= */}

        <section className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-blue-400">
            <ShieldAlert size={18} />

            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              Threat Intelligence
            </span>
          </div>

          <h1 className="text-3xl font-semibold text-white">
            Threat Analysis
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Analyze an IP address using multiple threat
            intelligence sources and determine its overall risk.
          </p>
        </section>

        {/* ======================================================
            ANALYSIS FORM
        ======================================================= */}

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="mb-5">
            <h2 className="text-sm font-semibold text-white">
              Analyze IP Address
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Enter an IP address to run a fresh threat
              intelligence analysis.
            </p>
          </div>

          <form
            onSubmit={analyzeIP}
            className="flex flex-col gap-3 md:flex-row"
          >
            <input
              type="text"
              value={ip}
              onChange={(event) => setIp(event.target.value)}
              placeholder="Enter IP address..."
              className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Analyzing...
                </>
              ) : (
                <>
                  <ShieldAlert size={18} />

                  Analyze IP
                </>
              )}
            </button>
          </form>

          {/* ERROR */}

          {error && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              <AlertCircle size={18} />

              <span>{error}</span>
            </div>
          )}

        </section>

        {/* ======================================================
            LOADING
        ======================================================= */}

        {loading && (
          <section className="mt-6 flex h-40 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50">

            <div className="text-center">

              <Loader2
                size={30}
                className="mx-auto animate-spin text-blue-400"
              />

              <p className="mt-3 text-sm text-slate-400">
                Running threat intelligence analysis...
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Querying intelligence sources and correlation engine
              </p>

            </div>

          </section>
        )}

        {/* ======================================================
            RESULTS
        ======================================================= */}

        {result && !loading && (
          <div className="mt-6 space-y-6">

            {/* ==================================================
                OVERVIEW
            =================================================== */}

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Analysis Result
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Combined threat intelligence assessment
                  </p>
                </div>

                <div
                  className={`rounded-md border px-3 py-1 text-xs font-semibold ${getThreatBadge()}`}
                >
                  {threatLevel || "UNKNOWN"}
                </div>

              </div>

              <div className="grid gap-4 md:grid-cols-3">

                {/* IP */}

                <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    IP Address
                  </p>

                  <p className="mt-3 break-all text-xl font-semibold text-white">
                    {result.ip}
                  </p>

                </div>

                {/* SCORE */}

                <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Threat Score
                  </p>

                  <p
                    className={`mt-3 text-3xl font-semibold ${getThreatColor()}`}
                  >
                    {result.threat_score}
                  </p>

                </div>

                {/* LEVEL */}

                <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Threat Level
                  </p>

                  <p
                    className={`mt-3 text-2xl font-semibold ${getThreatColor()}`}
                  >
                    {threatLevel || "UNKNOWN"}
                  </p>

                </div>

              </div>

            </section>

            {/* ==================================================
                ABUSEIPDB
            =================================================== */}

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-5 flex items-center gap-3">

                <ShieldAlert
                  size={20}
                  className="text-orange-400"
                />

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    AbuseIPDB
                  </h2>

                  <p className="text-xs text-slate-500">
                    IP reputation intelligence
                  </p>
                </div>

              </div>

              <div className="grid gap-4 md:grid-cols-2">

                <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

                  <p className="text-xs text-slate-500">
                    Confidence Score
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-white">
                    {result.abuseipdb?.confidence_score ?? 0}%
                  </p>

                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

                  <p className="text-xs text-slate-500">
                    Total Reports
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-white">
                    {result.abuseipdb?.total_reports ?? 0}
                  </p>

                </div>

              </div>

            </section>

            {/* ==================================================
                VIRUSTOTAL
            =================================================== */}

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-5 flex items-center gap-3">

                <ShieldCheck
                  size={20}
                  className="text-emerald-400"
                />

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    VirusTotal
                  </h2>

                  <p className="text-xs text-slate-500">
                    Multi-engine threat detection
                  </p>
                </div>

              </div>

              <div className="grid gap-4 md:grid-cols-3">

                <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-5">

                  <p className="text-xs text-slate-500">
                    Malicious
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-red-400">
                    {result.virustotal?.malicious ?? 0}
                  </p>

                </div>

                <div className="rounded-lg border border-yellow-900/30 bg-yellow-950/20 p-5">

                  <p className="text-xs text-slate-500">
                    Suspicious
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-yellow-400">
                    {result.virustotal?.suspicious ?? 0}
                  </p>

                </div>

                <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/20 p-5">

                  <p className="text-xs text-slate-500">
                    Harmless
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-emerald-400">
                    {result.virustotal?.harmless ?? 0}
                  </p>

                </div>

              </div>

            </section>

            {/* ==================================================
                RISK FACTORS
            =================================================== */}

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-5 flex items-center gap-3">

                <AlertCircle
                  size={20}
                  className="text-yellow-400"
                />

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Risk Factors
                  </h2>

                  <p className="text-xs text-slate-500">
                    Factors contributing to the threat assessment
                  </p>
                </div>

              </div>

              {result.analysis?.risk_factors?.length ? (
                <div className="space-y-2">

                  {result.analysis.risk_factors.map(
                    (factor, index) => (
                      <div
                        key={`${factor}-${index}`}
                        className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3"
                      >
                        <span className="text-xs font-semibold text-yellow-400">
                          {index + 1}
                        </span>

                        <p className="text-sm text-slate-300">
                          {factor}
                        </p>
                      </div>
                    )
                  )}

                </div>
              ) : (
                <div className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-4">

                  <p className="text-sm text-slate-500">
                    No significant risk factors identified.
                  </p>

                </div>
              )}

            </section>

            {/* ==================================================
                SUMMARY
            =================================================== */}

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-4 flex items-center gap-3">

                <ShieldCheck
                  size={20}
                  className="text-blue-400"
                />

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Analyst Summary
                  </h2>

                  <p className="text-xs text-slate-500">
                    Correlation engine assessment
                  </p>
                </div>

              </div>

              <p className="text-sm leading-7 text-slate-300">
                {result.analysis?.summary ||
                  "No analysis summary available."}
              </p>

            </section>

          </div>
        )}

      </div>
    </main>
  );
}