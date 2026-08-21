"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Database,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldAlert,
  Target,
  TrendingUp,
  Clock,
} from "lucide-react";

import { api } from "@/lib/api";

type IOC = {
  id: number;
  indicator?: string;
  value?: string;
  type?: string;
  source?: string;
  threat_level?: string;
  created_at?: string;
};

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

function normalizeThreatLevel(level?: string) {
  return (level || "LOW").toUpperCase();
}

function threatColor(level?: string) {
  switch (normalizeThreatLevel(level)) {
    case "CRITICAL":
      return "text-red-400";
    case "HIGH":
      return "text-orange-400";
    case "MEDIUM":
      return "text-yellow-400";
    default:
      return "text-emerald-400";
  }
}

function formatDate(date?: string) {
  if (!date) return "Unknown";

  try {
    return new Date(date).toLocaleDateString("en-IN");
  } catch {
    return "Unknown";
  }
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-semibold text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [analyses, setAnalyses] = useState<ThreatAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);

      const [iocData, analysisData] = await Promise.all([
        api.get("/api/v1/iocs?limit=100"),
        api.get("/api/v1/threat-analysis?limit=100"),
      ]);

      setIocs(
        Array.isArray(iocData)
          ? (iocData as IOC[])
          : []
      );

      setAnalyses(
        Array.isArray(analysisData)
          ? (analysisData as ThreatAnalysis[])
          : []
      );
    } catch (error) {
      console.error("Dashboard API error:", error);

      setIocs([]);
      setAnalyses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    const totalIOCs = iocs.length;

    const highRisk = iocs.filter((ioc) => {
      const level = normalizeThreatLevel(
        ioc.threat_level
      );

      return (
        level === "HIGH" ||
        level === "CRITICAL"
      );
    }).length;

    const totalAnalyses = analyses.length;

    const averageScore =
      totalAnalyses > 0
        ? analyses.reduce(
            (sum, analysis) =>
              sum +
              Number(
                analysis.threat_score || 0
              ),
            0
          ) / totalAnalyses
        : 0;

    return {
      totalIOCs,
      highRisk,
      totalAnalyses,
      averageScore: averageScore.toFixed(2),
    };
  }, [iocs, analyses]);

  const distribution = useMemo(() => {
    const critical = iocs.filter(
      (ioc) =>
        normalizeThreatLevel(
          ioc.threat_level
        ) === "CRITICAL"
    ).length;

    const high = iocs.filter(
      (ioc) =>
        normalizeThreatLevel(
          ioc.threat_level
        ) === "HIGH"
    ).length;

    const medium = iocs.filter(
      (ioc) =>
        normalizeThreatLevel(
          ioc.threat_level
        ) === "MEDIUM"
    ).length;

    const low = iocs.filter(
      (ioc) =>
        normalizeThreatLevel(
          ioc.threat_level
        ) === "LOW"
    ).length;

    const total = Math.max(
      iocs.length,
      1
    );

    return [
      {
        name: "Critical",
        count: critical,
        percentage: Math.round(
          (critical / total) * 100
        ),
        text: "text-red-400",
        bar: "bg-red-500",
      },
      {
        name: "High",
        count: high,
        percentage: Math.round(
          (high / total) * 100
        ),
        text: "text-orange-400",
        bar: "bg-orange-500",
      },
      {
        name: "Medium",
        count: medium,
        percentage: Math.round(
          (medium / total) * 100
        ),
        text: "text-yellow-400",
        bar: "bg-yellow-500",
      },
      {
        name: "Low",
        count: low,
        percentage: Math.round(
          (low / total) * 100
        ),
        text: "text-emerald-400",
        bar: "bg-emerald-500",
      },
    ];
  }, [iocs]);

  const intelligence = useMemo(() => {
    return {
      critical: iocs.filter(
        (ioc) =>
          normalizeThreatLevel(
            ioc.threat_level
          ) === "CRITICAL"
      ).length,

      high: iocs.filter(
        (ioc) =>
          normalizeThreatLevel(
            ioc.threat_level
          ) === "HIGH"
      ).length,

      medium: iocs.filter(
        (ioc) =>
          normalizeThreatLevel(
            ioc.threat_level
          ) === "MEDIUM"
      ).length,

      low: iocs.filter(
        (ioc) =>
          normalizeThreatLevel(
            ioc.threat_level
          ) === "LOW"
      ).length,
    };
  }, [iocs]);

  return (
    <div className="w-full min-w-0">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-8 lg:px-10">

        {/* PAGE HEADER */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Activity
                size={20}
                className="text-blue-400"
              />

              <span className="text-sm font-semibold uppercase tracking-wide text-blue-400">
                Security Operations Center
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white">
              Threat Intelligence Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor indicators of compromise,
              threat activity and security
              investigations.
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total IOCs"
            value={
              loading
                ? "—"
                : stats.totalIOCs
            }
            description="Tracked indicators"
            icon={Database}
            iconClass="bg-blue-500/10 text-blue-400"
          />

          <StatCard
            title="High Risk"
            value={
              loading
                ? "—"
                : stats.highRisk
            }
            description="High / critical indicators"
            icon={ShieldAlert}
            iconClass="bg-red-500/10 text-red-400"
          />

          <StatCard
            title="Threat Analyses"
            value={
              loading
                ? "—"
                : stats.totalAnalyses
            }
            description="Completed investigations"
            icon={Target}
            iconClass="bg-purple-500/10 text-purple-400"
          />

          <StatCard
            title="Average Threat Score"
            value={
              loading
                ? "—"
                : stats.averageScore
            }
            description="Risk score out of 100"
            icon={TrendingUp}
            iconClass="bg-emerald-500/10 text-emerald-400"
          />

        </div>

        {/* MIDDLE SECTION */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* THREAT DISTRIBUTION */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="flex items-start justify-between">

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Threat Distribution
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current IOC threat levels
                </p>
              </div>

              <ShieldCheck
                size={20}
                className="text-slate-500"
              />

            </div>

            <div className="mt-7 space-y-5">

              {distribution.map(
                (item) => (
                  <div key={item.name}>

                    <div className="mb-2 flex items-center justify-between">

                      <span
                        className={`text-sm font-medium ${item.text}`}
                      >
                        {item.name}
                      </span>

                      <span className="text-xs text-slate-500">
                        {item.count} (
                        {item.percentage}%)
                      </span>

                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">

                      <div
                        className={`h-full rounded-full transition-all ${item.bar}`}
                        style={{
                          width: `${item.percentage}%`,
                        }}
                      />

                    </div>

                  </div>
                )
              )}

            </div>

          </section>

          {/* INTELLIGENCE OVERVIEW */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Intelligence Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Threat intelligence platform
                  status
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-emerald-400">

                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                Operational

              </div>

            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">
                  IOC Database
                </p>

                <p className="mt-2 text-lg font-semibold text-white">
                  {stats.totalIOCs} indicators
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">
                  Threat Analyses
                </p>

                <p className="mt-2 text-lg font-semibold text-white">
                  {stats.totalAnalyses} investigations
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">
                  Critical IOCs
                </p>

                <p className="mt-2 text-lg font-semibold text-red-400">
                  {intelligence.critical}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">
                  High Risk IOCs
                </p>

                <p className="mt-2 text-lg font-semibold text-orange-400">
                  {intelligence.high}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">
                  Medium Risk
                </p>

                <p className="mt-2 text-lg font-semibold text-yellow-400">
                  {intelligence.medium}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">
                  Low Risk
                </p>

                <p className="mt-2 text-lg font-semibold text-emerald-400">
                  {intelligence.low}
                </p>
              </div>

            </div>

          </section>

        </div>

        {/* RECENT INVESTIGATIONS */}
        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold text-white">
                Recent Investigations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest threat intelligence
                assessments
              </p>
            </div>

            <Clock
              size={20}
              className="text-slate-500"
            />

          </div>

          <div className="mt-5 space-y-3">

            {analyses.length === 0 ? (

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-6 text-center text-sm text-slate-500">
                No investigations available.
              </div>

            ) : (

              analyses
                .slice(0, 5)
                .map((analysis) => (

                  <div
                    key={analysis.id}
                    className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700 md:flex-row md:items-center md:justify-between"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                        <Search size={18} />
                      </div>

                      <div>

                        <p className="font-medium text-white">
                          {analysis.ip}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Analysis #{analysis.id} •{" "}
                          {formatDate(
                            analysis.created_at
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="flex items-center gap-4">

                      <div className="text-right">

                        <p className="text-xs text-slate-500">
                          Threat Score
                        </p>

                        <p
                          className={`mt-1 text-lg font-semibold ${threatColor(
                            analysis.threat_level
                          )}`}
                        >
                          {Number(
                            analysis.threat_score || 0
                          ).toFixed(2)}
                        </p>

                      </div>

                      <span
                        className={`rounded-md border px-3 py-1 text-xs font-semibold ${threatColor(
                          analysis.threat_level
                        )}`}
                      >
                        {normalizeThreatLevel(
                          analysis.threat_level
                        )}
                      </span>

                    </div>

                  </div>

                ))

            )}

          </div>

        </section>

        {/* FOOTER */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-5 text-xs text-slate-600 sm:flex-row">

          <span>
            ThreatLens AI • Enterprise Threat Intelligence
          </span>

          <span>
            Security Operations Center
          </span>

        </div>

      </div>
    </div>
  );
}