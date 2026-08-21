"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Database,
  Search,
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";

import { api } from "../../lib/api";

type ThreatAnalysis = {
  id: number;
  ip: string;
  threat_level: string;
  abuse_total_reports: number;
  abuse_confidence_score: number;
  risk_factors: string[];
  created_at: string;
  threat_score: number;
  vt_malicious: number;
  vt_suspicious: number;
  vt_harmless: number;
  summary: string;
};

export default function CorrelationPage() {
  const [ip, setIp] = useState("8.8.8.8");
  const [result, setResult] = useState<ThreatAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // ANALYZE IP
  // ============================================================

  const analyzeIP = async () => {
    const cleanIP = ip.trim();

    if (!cleanIP) {
      setError("Please enter an IP address.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
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

      console.log("Correlation API Response:", data);

      if (!data || typeof data !== "object") {
        throw new Error(
          "Invalid response received from the backend."
        );
      }

      /*
       * Backend response:
       *
       * {
       *   ip: "...",
       *   threat_score: ...,
       *   threat_level: "...",
       *   abuseipdb: {...},
       *   virustotal: {...},
       *   analysis: {...}
       * }
       */

      const formattedResult: ThreatAnalysis = {
        id: data.id ?? Date.now(),

        ip: data.ip ?? cleanIP,

        threat_level:
          data.threat_level ??
          data.analysis?.threat_level ??
          "LOW",

        abuse_total_reports:
          data.abuseipdb?.total_reports ?? 0,

        abuse_confidence_score:
          data.abuseipdb?.confidence_score ?? 0,

        risk_factors:
          data.analysis?.risk_factors ?? [],

        created_at:
          data.created_at ??
          new Date().toISOString(),

        threat_score:
          Number(data.threat_score ?? 0),

        vt_malicious:
          data.virustotal?.malicious ?? 0,

        vt_suspicious:
          data.virustotal?.suspicious ?? 0,

        vt_harmless:
          data.virustotal?.harmless ?? 0,

        summary:
          data.analysis?.summary ??
          "No analysis summary available.",
      };

      setResult(formattedResult);
    } catch (err) {
      console.error("Correlation error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the threat analysis API."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // THREAT LEVEL
  // ============================================================

  const threatLevel =
    result?.threat_level?.toUpperCase() || "UNKNOWN";

  const threatScore =
    result?.threat_score ?? 0;

  // ============================================================
  // THREAT COLORS
  // ============================================================

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

  const getScoreColor = () => {
    if (threatScore >= 80) {
      return "text-red-400";
    }

    if (threatScore >= 60) {
      return "text-orange-400";
    }

    if (threatScore >= 30) {
      return "text-yellow-400";
    }

    return "text-emerald-400";
  };

  const getScoreBarColor = () => {
    if (threatScore >= 80) {
      return "bg-red-500";
    }

    if (threatScore >= 60) {
      return "bg-orange-500";
    }

    if (threatScore >= 30) {
      return "bg-yellow-500";
    }

    return "bg-emerald-500";
  };

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-full bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-[1600px] p-6">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <section className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-blue-400">
            <Activity size={18} />

            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              Security Operations Center
            </span>
          </div>

          <h1 className="text-3xl font-semibold text-white">
            Threat Intelligence Correlation
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Correlate threat intelligence from multiple sources
            to determine the risk associated with an IP address.
          </p>
        </section>

        {/* =====================================================
            ANALYZE SECTION
        ====================================================== */}

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="mb-5">
            <h2 className="text-sm font-semibold text-white">
              Analyze Indicator
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Enter an IPv4 or IPv6 address to perform threat
              correlation.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    analyzeIP();
                  }
                }}
                placeholder="Enter IP address..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-11 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <button
              onClick={analyzeIP}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldAlert size={18} />

              {loading ? "Analyzing..." : "Analyze IP"}
            </button>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              <AlertTriangle size={18} />

              <span>{error}</span>
            </div>
          )}

        </section>

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading && (
          <section className="mt-6 flex h-40 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50">

            <div className="text-center">

              <Activity
                size={28}
                className="mx-auto animate-pulse text-blue-400"
              />

              <p className="mt-3 text-sm text-slate-400">
                Correlating threat intelligence...
              </p>

            </div>

          </section>
        )}

        {/* =====================================================
            RESULTS
        ====================================================== */}

        {result && !loading && (
          <div className="mt-6 space-y-6">

            {/* =================================================
                CORRELATION RESULT
            ================================================== */}

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Correlation Result
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Combined threat intelligence analysis
                  </p>
                </div>

                <div
                  className={`rounded-md border px-3 py-1 text-xs font-semibold ${getThreatBadge()}`}
                >
                  {threatLevel}
                </div>

              </div>

              {/* IP + SCORE */}

              <div className="grid gap-4 md:grid-cols-2">

                <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

                  <div className="flex items-center gap-2">
                    <Target
                      size={16}
                      className="text-blue-400"
                    />

                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Indicator
                    </p>
                  </div>

                  <p className="mt-3 break-all text-xl font-semibold text-white">
                    {result.ip}
                  </p>

                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

                  <div className="flex items-center gap-2">
                    <TrendingUp
                      size={16}
                      className={getScoreColor()}
                    />

                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Threat Score
                    </p>
                  </div>

                  <p
                    className={`mt-3 text-3xl font-semibold ${getScoreColor()}`}
                  >
                    {threatScore}
                  </p>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">

                    <div
                      className={`h-full rounded-full transition-all ${getScoreBarColor()}`}
                      style={{
                        width: `${Math.min(
                          Math.max(threatScore, 0),
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                INTELLIGENCE SOURCES
            ================================================== */}

            <section>

              <div className="mb-4 flex items-center gap-2">

                <Database
                  size={17}
                  className="text-blue-400"
                />

                <h2 className="text-sm font-semibold text-white">
                  Intelligence Sources
                </h2>

              </div>

              <div className="grid gap-4 md:grid-cols-3">

                {/* ABUSEIPDB */}

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">

                  <div className="flex items-center gap-3">

                    <ShieldAlert
                      size={20}
                      className="text-orange-400"
                    />

                    <div>
                      <p className="text-sm font-semibold text-white">
                        AbuseIPDB
                      </p>

                      <p className="text-xs text-slate-500">
                        IP reputation
                      </p>
                    </div>

                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <div className="rounded-lg border border-slate-800 p-3">
                      <p className="text-xs text-slate-500">
                        Confidence
                      </p>

                      <p className="mt-1 text-lg font-semibold text-white">
                        {result.abuse_confidence_score}%
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-800 p-3">
                      <p className="text-xs text-slate-500">
                        Reports
                      </p>

                      <p className="mt-1 text-lg font-semibold text-white">
                        {result.abuse_total_reports}
                      </p>
                    </div>

                  </div>

                </div>

                {/* VIRUSTOTAL */}

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">

                  <div className="flex items-center gap-3">

                    <ShieldCheck
                      size={20}
                      className="text-emerald-400"
                    />

                    <div>
                      <p className="text-sm font-semibold text-white">
                        VirusTotal
                      </p>

                      <p className="text-xs text-slate-500">
                        Multi-engine detection
                      </p>
                    </div>

                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">

                    <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-3 text-center">
                      <p className="text-xs text-slate-500">
                        Malicious
                      </p>

                      <p className="mt-1 text-lg font-semibold text-red-400">
                        {result.vt_malicious}
                      </p>
                    </div>

                    <div className="rounded-lg border border-yellow-900/30 bg-yellow-950/20 p-3 text-center">
                      <p className="text-xs text-slate-500">
                        Suspicious
                      </p>

                      <p className="mt-1 text-lg font-semibold text-yellow-400">
                        {result.vt_suspicious}
                      </p>
                    </div>

                    <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/20 p-3 text-center">
                      <p className="text-xs text-slate-500">
                        Harmless
                      </p>

                      <p className="mt-1 text-lg font-semibold text-emerald-400">
                        {result.vt_harmless}
                      </p>
                    </div>

                  </div>

                </div>

                {/* ANALYSIS */}

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">

                  <div className="flex items-center gap-3">

                    <Activity
                      size={20}
                      className={getThreatColor()}
                    />

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Correlation Engine
                      </p>

                      <p className="text-xs text-slate-500">
                        Combined assessment
                      </p>
                    </div>

                  </div>

                  <div className="mt-5">

                    <p className="text-xs text-slate-500">
                      Threat Level
                    </p>

                    <p
                      className={`mt-1 text-lg font-semibold ${getThreatColor()}`}
                    >
                      {threatLevel}
                    </p>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                RISK FACTORS
            ================================================== */}

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-5 flex items-center gap-2">

                <AlertTriangle
                  size={18}
                  className="text-yellow-400"
                />

                <h2 className="text-sm font-semibold text-white">
                  Risk Factors
                </h2>

              </div>

              {result.risk_factors.length > 0 ? (
                <div className="space-y-2">

                  {result.risk_factors.map(
                    (factor, index) => (
                      <div
                        key={`${factor}-${index}`}
                        className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3"
                      >
                        <span className="mt-0.5 text-xs font-semibold text-yellow-400">
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
                    No significant risk factors were identified.
                  </p>

                </div>
              )}

            </section>

            {/* =================================================
                ANALYSIS SUMMARY
            ================================================== */}

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-4 flex items-center gap-2">

                <ShieldCheck
                  size={18}
                  className="text-blue-400"
                />

                <h2 className="text-sm font-semibold text-white">
                  Analyst Summary
                </h2>

              </div>

              <p className="text-sm leading-7 text-slate-300">
                {result.summary}
              </p>

            </section>

            {/* =================================================
                ANALYSIS METADATA
            ================================================== */}

            <section className="grid gap-4 md:grid-cols-2">

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">

                <div className="flex items-center gap-3">

                  <Database
                    size={18}
                    className="text-slate-500"
                  />

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Analysis ID
                    </p>

                    <p className="mt-1 text-sm font-medium text-white">
                      #{result.id}
                    </p>
                  </div>

                </div>

              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">

                <div className="flex items-center gap-3">

                  <Activity
                    size={18}
                    className="text-slate-500"
                  />

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Analyzed At
                    </p>

                    <p className="mt-1 text-sm font-medium text-white">
                      {formatDate(result.created_at)}
                    </p>
                  </div>

                </div>

              </div>

            </section>

          </div>
        )}

      </div>
    </main>
  );
}