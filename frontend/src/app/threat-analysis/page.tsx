"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Search,
  Database,
  Server,
  RefreshCw,
  Clock3,
  History,
} from "lucide-react";

type ThreatAnalysis = {
  id: number;
  ip: string;
  threat_score: number;
  threat_level: string;

  abuse_confidence_score: number;
  abuse_total_reports: number;

  vt_malicious: number;
  vt_suspicious: number;
  vt_harmless: number;

  risk_factors: string[];
  summary: string;

  created_at: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function ThreatAnalysisPage() {
  const [analyses, setAnalyses] = useState<ThreatAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] =
    useState<ThreatAnalysis | null>(null);

  const [searchIp, setSearchIp] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     GET IP FROM URL
     ========================================================= */

  const getIpFromUrl = () => {
    if (typeof window === "undefined") {
      return "";
    }

    const params = new URLSearchParams(
      window.location.search
    );

    return params.get("ip")?.trim() || "";
  };

  /* =========================================================
     FETCH ANALYSIS HISTORY
     ========================================================= */

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/v1/threat-analysis?limit=100`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Failed to load threat analyses (${response.status})`
        );
      }

      const results: ThreatAnalysis[] = Array.isArray(data)
        ? data
        : data?.items || data?.results || [];

      setAnalyses(results);

      const urlIp = getIpFromUrl();

      if (urlIp) {
        const matchingAnalysis = results.find(
          (analysis) =>
            analysis.ip.toLowerCase() ===
            urlIp.toLowerCase()
        );

        if (matchingAnalysis) {
          setSelectedAnalysis(matchingAnalysis);
          setSearchIp("");
        } else {
          setSelectedAnalysis(
            results.length > 0 ? results[0] : null
          );

          setSearchIp(urlIp);
        }
      } else {
        setSelectedAnalysis(
          results.length > 0 ? results[0] : null
        );
      }
    } catch (err) {
      console.error(
        "Threat Analysis API error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load threat analysis data."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    fetchAnalyses();
  }, []);

  /* =========================================================
     FILTER HISTORY
     ========================================================= */

  const filteredAnalyses = useMemo(() => {
    const query = searchIp.trim().toLowerCase();

    if (!query) {
      return analyses;
    }

    return analyses.filter((analysis) =>
      analysis.ip.toLowerCase().includes(query)
    );
  }, [analyses, searchIp]);

  /* =========================================================
     SELECT ANALYSIS
     ========================================================= */

  const handleSelectAnalysis = (
    analysis: ThreatAnalysis
  ) => {
    setSelectedAnalysis(analysis);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);

      url.searchParams.set("ip", analysis.ip);

      window.history.replaceState(
        {},
        "",
        url.toString()
      );
    }
  };

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] overflow-y-auto bg-slate-950 p-6 text-slate-200">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-blue-400"
            />

            <p className="mt-4 text-sm text-slate-400">
              Loading threat analysis data...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     MAIN PAGE
     ========================================================= */

  return (
    <main className="min-h-[calc(100vh-4rem)] overflow-y-auto bg-slate-950 p-6 text-slate-200">
      <div className="mx-auto w-full max-w-[1600px]">

        {/* =================================================
           PAGE HEADER
           ================================================= */}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-blue-400">
              Security Operations Center
            </p>

            <h1 className="text-2xl font-semibold text-white">
              Threat Analysis
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Investigate historical threat assessments and
              analyze indicator risk.
            </p>
          </div>

          <button
            onClick={fetchAnalyses}
            className="flex w-fit items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw size={16} />

            Refresh
          </button>
        </div>

        {/* =================================================
           ERROR
           ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <div>
              <p className="text-sm font-medium text-red-400">
                Unable to load threat analysis
              </p>

              <p className="mt-1 text-xs text-red-300/70">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
           SEARCH
           ================================================= */}

        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">
              Investigation History
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Search previously analyzed indicators.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
              <Search
                size={17}
                className="shrink-0 text-slate-500"
              />

              <input
                type="text"
                value={searchIp}
                onChange={(e) =>
                  setSearchIp(e.target.value)
                }
                placeholder="Search IP address..."
                className="w-full min-w-0 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
              />
            </div>

            <div className="flex shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-500">
              {filteredAnalyses.length} investigation
              {filteredAnalyses.length !== 1
                ? "s"
                : ""}
            </div>
          </div>
        </section>

        {/* =================================================
           EMPTY STATE
           ================================================= */}

        {analyses.length === 0 && !error && (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <Activity
              size={28}
              className="mx-auto text-slate-600"
            />

            <p className="mt-4 text-sm text-slate-400">
              No threat analyses found.
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Analyze an IP from the Correlation module
              to create an investigation.
            </p>
          </div>
        )}

        {/* =================================================
           CONTENT
           ================================================= */}

        {analyses.length > 0 && (
          <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">

            {/* =================================================
               HISTORY
               ================================================= */}

            <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-5 xl:col-span-1">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <History
                    size={18}
                    className="text-blue-400"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Analysis History
                  </h2>

                  <p className="text-xs text-slate-500">
                    Latest investigations
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {filteredAnalyses.map(
                  (analysis) => (
                    <AnalysisHistoryItem
                      key={analysis.id}
                      analysis={analysis}
                      selected={
                        selectedAnalysis?.id ===
                        analysis.id
                      }
                      onClick={() =>
                        handleSelectAnalysis(
                          analysis
                        )
                      }
                    />
                  )
                )}
              </div>

              {filteredAnalyses.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center">
                  <p className="text-xs text-slate-600">
                    No matching investigations.
                  </p>
                </div>
              )}
            </section>

            {/* =================================================
               DETAILS
               ================================================= */}

            <section className="min-w-0 xl:col-span-2">
              {selectedAnalysis ? (
                <AnalysisDetails
                  analysis={selectedAnalysis}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center">
                  <p className="text-sm text-slate-500">
                    Select an investigation to view
                    details.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}


/* ============================================================
   ANALYSIS HISTORY ITEM
   ============================================================ */

function AnalysisHistoryItem({
  analysis,
  selected,
  onClick,
}: {
  analysis: ThreatAnalysis;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition ${
        selected
          ? "border-blue-500/30 bg-blue-500/5"
          : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all font-mono text-sm font-semibold text-slate-200">
            {analysis.ip}
          </p>

          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
            <Clock3 size={12} />

            {formatDate(analysis.created_at)}
          </div>
        </div>

        <ThreatBadge
          level={analysis.threat_level}
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
        <span className="text-[11px] text-slate-600">
          Threat Score
        </span>

        <span
          className={`text-sm font-semibold ${getScoreTextColor(
            analysis.threat_score
          )}`}
        >
          {analysis.threat_score}
        </span>
      </div>
    </button>
  );
}


/* ============================================================
   ANALYSIS DETAILS
   ============================================================ */

function AnalysisDetails({
  analysis,
}: {
  analysis: ThreatAnalysis;
}) {
  return (
    <div className="min-w-0 space-y-6">

      {/* INVESTIGATION HEADER */}

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Search
                size={22}
                className="text-blue-400"
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Investigated IP
              </p>

              <h2 className="mt-1 break-all font-mono text-xl font-semibold text-white">
                {analysis.ip}
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Analysis #{analysis.id} ·{" "}
                {formatDate(
                  analysis.created_at
                )}
              </p>
            </div>
          </div>

          <ThreatBadge
            level={analysis.threat_level}
            large
          />
        </div>
      </section>

      {/* SCORE + PROVIDERS */}

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">

        {/* THREAT SCORE */}

        <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Threat Score
              </p>

              <p
                className={`mt-3 text-4xl font-semibold ${getScoreTextColor(
                  analysis.threat_score
                )}`}
              >
                {analysis.threat_score}

                <span className="text-lg text-slate-600">
                  /100
                </span>
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Activity
                size={22}
                className="text-blue-400"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${getScoreBarColor(
                  analysis.threat_score
                )}`}
                style={{
                  width: `${Math.min(
                    Math.max(
                      analysis.threat_score,
                      0
                    ),
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[11px] text-slate-600">
              <span>0</span>
              <span>30</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>
          </div>
        </section>

        {/* ABUSEIPDB */}

        <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <Database
                size={19}
                className="text-orange-400"
              />
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

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Metric
              label="Confidence"
              value={`${analysis.abuse_confidence_score}%`}
            />

            <Metric
              label="Reports"
              value={analysis.abuse_total_reports}
            />
          </div>
        </section>

        {/* VIRUSTOTAL */}

        <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Server
                size={19}
                className="text-blue-400"
              />
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

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Metric
              label="Malicious"
              value={analysis.vt_malicious}
            />

            <Metric
              label="Suspicious"
              value={analysis.vt_suspicious}
            />

            <Metric
              label="Harmless"
              value={analysis.vt_harmless}
            />
          </div>
        </section>
      </div>

      {/* RISK + SUMMARY */}

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">

        {/* RISK FACTORS */}

        <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
              <AlertTriangle
                size={19}
                className="text-yellow-400"
              />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white">
                Risk Factors
              </h2>

              <p className="text-xs text-slate-500">
                Indicators contributing to the
                assessment
              </p>
            </div>
          </div>

          {analysis.risk_factors &&
          analysis.risk_factors.length > 0 ? (
            <div className="space-y-3">
              {analysis.risk_factors.map(
                (factor, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3"
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-yellow-400" />

                    <p className="text-sm text-slate-300">
                      {factor}
                    </p>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center">
              <p className="text-sm text-slate-500">
                No significant risk factors
                detected.
              </p>
            </div>
          )}
        </section>

        {/* SECURITY ASSESSMENT */}

        <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <ShieldCheck
                size={19}
                className="text-emerald-400"
              />
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

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-5">
            <p className="text-sm leading-6 text-slate-400">
              {analysis.summary}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <span className="text-xs text-slate-600">
              Analysis sources
            </span>

            <div className="flex gap-2">
              <span className="rounded-md border border-slate-800 px-2 py-1 text-[11px] text-slate-500">
                AbuseIPDB
              </span>

              <span className="rounded-md border border-slate-800 px-2 py-1 text-[11px] text-slate-500">
                VirusTotal
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


/* ============================================================
   THREAT BADGE
   ============================================================ */

function ThreatBadge({
  level,
  large = false,
}: {
  level: string;
  large?: boolean;
}) {
  const normalizedLevel =
    (level || "LOW").toUpperCase();

  const styles =
    normalizedLevel === "CRITICAL"
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : normalizedLevel === "HIGH"
      ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
      : normalizedLevel === "MEDIUM"
      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

  return (
    <div
      className={`flex shrink-0 items-center gap-2 rounded-lg border ${styles} ${
        large
          ? "px-4 py-2"
          : "px-2 py-1"
      }`}
    >
      {normalizedLevel === "LOW" ? (
        <ShieldCheck
          size={large ? 18 : 13}
        />
      ) : (
        <ShieldAlert
          size={large ? 18 : 13}
        />
      )}

      <span
        className={`font-semibold ${
          large
            ? "text-sm"
            : "text-[10px]"
        }`}
      >
        {normalizedLevel}
        {large ? " THREAT" : ""}
      </span>
    </div>
  );
}


/* ============================================================
   METRIC
   ============================================================ */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
      <p className="truncate text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}


/* ============================================================
   HELPERS
   ============================================================ */

function formatDate(date: string) {
  if (!date) {
    return "Unknown";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function getScoreTextColor(score: number) {
  if (score >= 80) {
    return "text-red-400";
  }

  if (score >= 60) {
    return "text-orange-400";
  }

  if (score >= 30) {
    return "text-yellow-400";
  }

  return "text-emerald-400";
}


function getScoreBarColor(score: number) {
  if (score >= 80) {
    return "bg-red-500";
  }

  if (score >= 60) {
    return "bg-orange-500";
  }

  if (score >= 30) {
    return "bg-yellow-500";
  }

  return "bg-emerald-500";
}