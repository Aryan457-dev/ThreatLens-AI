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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api/v1";

export default function CorrelationPage() {
  const [ip, setIp] = useState("8.8.8.8");
  const [result, setResult] = useState<ThreatAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const response = await fetch(
        `${API_BASE_URL}/threat-analysis/${encodeURIComponent(
          cleanIP
        )}/analyze`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json().catch(() => null);

      console.log("Correlation API Response:", data);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Threat analysis failed with status ${response.status}`
        );
      }

      if (!data || typeof data !== "object") {
        throw new Error(
          "Invalid response received from the backend."
        );
      }

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

  const threatLevel =
    result?.threat_level?.toUpperCase() || "UNKNOWN";

  const threatScore = result?.threat_score ?? 0;

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

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  };

  return (
    <main className="min-h-full bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-[1600px] p-6">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <section className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

          <div>
            <div className="mb-2 flex items-center gap-2 text-blue-400">
              <Activity size={18} />

              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                Security Operations Center
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Threat Correlation
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Correlate intelligence from multiple threat sources
              and determine the risk associated with an indicator.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-xs font-medium text-emerald-400">
              Intelligence Sources Operational
            </span>
          </div>

        </section>

        {/* =====================================================
            SEARCH / ANALYZE
        ====================================================== */}

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">

          <div className="mb-5 flex items-center gap-3">

            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Target size={19} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white">
                Correlate Indicator
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Enter an IP address to query configured threat
                intelligence sources.
              </p>
            </div>

          </div>

          <div className="flex flex-col gap-3 lg:flex-row">

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
                className="h-12 w-full rounded-lg border border-slate-800 bg-slate-950 px-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />

            </div>

            <button
              onClick={analyzeIP}
              disabled={loading}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading ? (
                <Activity
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <ShieldAlert size={18} />
              )}

              {loading
                ? "Correlating..."
                : "Analyze Indicator"}

            </button>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">

              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <p className="text-sm font-medium text-red-400">
                  Analysis Failed
                </p>

                <p className="mt-1 text-xs text-red-400/70">
                  {error}
                </p>
              </div>

            </div>
          )}

        </section>

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading && (
          <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-10">

            <div className="flex flex-col items-center justify-center">

              <div className="rounded-full bg-blue-500/10 p-4 text-blue-400">
                <Activity
                  size={28}
                  className="animate-spin"
                />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-300">
                Correlating threat intelligence
              </p>

              <p className="mt-2 text-xs text-slate-600">
                Querying AbuseIPDB and VirusTotal...
              </p>

            </div>

          </section>
        )}

        {/* =====================================================
            EMPTY STATE
        ====================================================== */}

        {!result && !loading && !error && (
          <section className="mt-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-16">

            <div className="mx-auto max-w-md text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-slate-600">
                <Activity size={27} />
              </div>

              <h2 className="mt-5 text-sm font-semibold text-slate-300">
                Ready for Threat Correlation
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Enter an IP address above to collect intelligence,
                calculate a threat score and identify risk factors.
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
                RESULT HEADER
            ================================================== */}

            <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                <div className="flex items-center gap-4">

                  <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                    <Target size={24} />
                  </div>

                  <div>

                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Investigated Indicator
                    </p>

                    <p className="mt-1 font-mono text-xl font-semibold text-white">
                      {result.ip}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Analysis #{result.id} •{" "}
                      {formatDate(result.created_at)}
                    </p>

                  </div>

                </div>

                <div
                  className={`rounded-lg border px-4 py-2 text-xs font-semibold ${getThreatBadge()}`}
                >
                  {threatLevel} THREAT
                </div>

              </div>

            </section>

            {/* =================================================
                SCORE + SOURCES
            ================================================== */}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

              {/* THREAT SCORE */}

              <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Threat Score
                    </p>

                    <div className="mt-3 flex items-end gap-2">

                      <span
                        className={`text-4xl font-semibold ${getThreatColor()}`}
                      >
                        {Number(threatScore).toFixed(2)}
                      </span>

                      <span className="mb-1 text-sm text-slate-600">
                        /100
                      </span>

                    </div>

                  </div>

                  <div className="rounded-lg bg-blue-500/10 p-3 text-blue-400">
                    <TrendingUp size={20} />
                  </div>

                </div>

                <div className="mt-6">

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">

                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${Math.min(
                          Math.max(threatScore, 0),
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-slate-700">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>

                </div>

              </section>

              {/* ABUSEIPDB */}

              <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">

                <div className="mb-5 flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400">
                      <ShieldAlert size={19} />
                    </div>

                    <div>

                      <h2 className="text-sm font-semibold text-white">
                        AbuseIPDB
                      </h2>

                      <p className="text-xs text-slate-500">
                        IP abuse reputation
                      </p>

                    </div>

                  </div>

                  <span className="text-xs text-emerald-400">
                    Connected
                  </span>

                </div>

                <div className="grid grid-cols-2 gap-3">

                  <Metric
                    label="Confidence"
                    value={`${result.abuse_confidence_score}%`}
                  />

                  <Metric
                    label="Reports"
                    value={String(result.abuse_total_reports)}
                  />

                </div>

              </section>

              {/* VIRUSTOTAL */}

              <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">

                <div className="mb-5 flex items-center gap-3">

                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                    <Database size={19} />
                  </div>

                  <div>

                    <h2 className="text-sm font-semibold text-white">
                      VirusTotal
                    </h2>

                    <p className="text-xs text-slate-500">
                      Multi-engine analysis
                    </p>

                  </div>

                </div>

                <div className="grid grid-cols-3 gap-2">

                  <Metric
                    label="Malicious"
                    value={String(result.vt_malicious)}
                  />

                  <Metric
                    label="Suspicious"
                    value={String(result.vt_suspicious)}
                  />

                  <Metric
                    label="Harmless"
                    value={String(result.vt_harmless)}
                  />

                </div>

              </section>

            </div>

            {/* =================================================
                RISK FACTORS + SUMMARY
            ================================================== */}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* RISK FACTORS */}

              <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">

                <div className="mb-5 flex items-center gap-3">

                  <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-400">
                    <AlertTriangle size={19} />
                  </div>

                  <div>

                    <h2 className="text-sm font-semibold text-white">
                      Risk Factors
                    </h2>

                    <p className="text-xs text-slate-500">
                      Indicators contributing to the assessment
                    </p>

                  </div>

                </div>

                {result.risk_factors.length > 0 ? (

                  <div className="space-y-2">

                    {result.risk_factors.map(
                      (factor, index) => (
                        <div
                          key={`${factor}-${index}`}
                          className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3"
                        >

                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />

                          <span className="text-sm text-slate-400">
                            {factor}
                          </span>

                        </div>
                      )
                    )}

                  </div>

                ) : (

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-5 text-center">

                    <ShieldCheck
                      size={22}
                      className="mx-auto text-emerald-400"
                    />

                    <p className="mt-3 text-sm text-slate-400">
                      No significant risk factors identified.
                    </p>

                  </div>

                )}

              </section>

              {/* SECURITY ASSESSMENT */}

              <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">

                <div className="mb-5 flex items-center gap-3">

                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                    <ShieldCheck size={19} />
                  </div>

                  <div>

                    <h2 className="text-sm font-semibold text-white">
                      Security Assessment
                    </h2>

                    <p className="text-xs text-slate-500">
                      Unified threat intelligence summary
                    </p>

                  </div>

                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

                  <p className="text-sm leading-6 text-slate-400">
                    {result.summary}
                  </p>

                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">

                    <p className="text-xs text-slate-600">
                      Threat Level
                    </p>

                    <p
                      className={`mt-2 text-sm font-semibold ${getThreatColor()}`}
                    >
                      {threatLevel}
                    </p>

                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">

                    <p className="text-xs text-slate-600">
                      Sources
                    </p>

                    <p className="mt-2 text-sm font-semibold text-white">
                      2
                    </p>

                  </div>

                </div>

              </section>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}

/* =========================================================
   METRIC COMPONENT
========================================================= */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">

      <p className="truncate text-[11px] uppercase tracking-wide text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-white">
        {value}
      </p>

    </div>
  );
}