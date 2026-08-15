"use client";

import { useState } from "react";
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Database,
  Activity,
  Globe,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

type AbuseResult = {
  data?: {
    ipAddress?: string;
    countryCode?: string;
    isp?: string;
    domain?: string;
    usageType?: string;
    abuseConfidenceScore?: number;
    totalReports?: number;
    numDistinctUsers?: number;
    lastReportedAt?: string;
  };
};

type VirusTotalResult = {
  ip?: string;
  country?: string;
  asn?: number;
  network?: string;
  reputation?: number;
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  undetected?: number;
};

type ThreatAnalysisResult = {
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

export default function ThreatFeedPage() {
  const [ip, setIp] = useState("");

  const [loading, setLoading] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);

  const [abuseData, setAbuseData] =
    useState<AbuseResult | null>(null);

  const [virusTotalData, setVirusTotalData] =
    useState<VirusTotalResult | null>(null);

  const [analysisResult, setAnalysisResult] =
    useState<ThreatAnalysisResult | null>(null);

  const [error, setError] = useState("");

  const [analysisError, setAnalysisError] =
    useState("");

  // ============================================================
  // CHECK THREAT FEEDS
  // ============================================================

  async function checkThreatFeeds() {
    if (!ip.trim()) {
      setError("Please enter an IP address.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysisError("");

    setAbuseData(null);
    setVirusTotalData(null);
    setAnalysisResult(null);

    try {
      const encodedIP = encodeURIComponent(ip.trim());

      const [abuseResponse, virusTotalResponse] =
        await Promise.all([
          fetch(
            `${API_URL}/api/v1/threat-feed/check/${encodedIP}`
          ),

          fetch(
            `${API_URL}/api/v1/threat-feed/virustotal/${encodedIP}`
          ),
        ]);

      if (!abuseResponse.ok) {
        const data =
          await abuseResponse.json().catch(() => null);

        throw new Error(
          data?.detail ||
            "AbuseIPDB request failed."
        );
      }

      if (!virusTotalResponse.ok) {
        const data =
          await virusTotalResponse.json().catch(() => null);

        throw new Error(
          data?.detail ||
            "VirusTotal request failed."
        );
      }

      const abuse =
        await abuseResponse.json();

      const virusTotal =
        await virusTotalResponse.json();

      setAbuseData(abuse);
      setVirusTotalData(virusTotal);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve threat intelligence."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // RUN THREAT CORRELATION
  // ============================================================

  async function analyzeIndicator() {
    if (!ip.trim()) {
      setAnalysisError(
        "Please enter an IP address first."
      );
      return;
    }

    setAnalyzing(true);
    setAnalysisError("");
    setAnalysisResult(null);

    try {
      const encodedIP = encodeURIComponent(ip.trim());

      const response = await fetch(
        `${API_URL}/api/v1/threat-feed/analyze/${encodedIP}`
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Threat analysis failed (${response.status}).`
        );
      }

      setAnalysisResult(data);
    } catch (err) {
      console.error("Threat analysis error:", err);

      setAnalysisError(
        err instanceof Error
          ? err.message
          : "Unable to complete threat analysis."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  // ============================================================
  // ENTER KEY
  // ============================================================

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Enter") {
      checkThreatFeeds();
    }
  }

  // ============================================================
  // THREAT LEVEL STYLE
  // ============================================================

  function threatLevelClass(level?: string) {
    switch (level?.toUpperCase()) {
      case "CRITICAL":
        return "border-red-500/30 bg-red-500/10 text-red-400";

      case "HIGH":
        return "border-orange-500/30 bg-orange-500/10 text-orange-400";

      case "MEDIUM":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

      default:
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    }
  }

  const abuse = abuseData?.data;

  const hasFeedResults =
    Boolean(abuseData || virusTotalData);

  return (
    <div className="min-h-full bg-slate-950 px-6 pb-8 pt-8">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-8">

        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-blue-400">
          Security Operations Center
        </p>

        <h1 className="text-2xl font-semibold text-white">
          Threat Feed
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Query external threat intelligence sources and
          investigate IP reputation.
        </p>

      </div>

      {/* ======================================================
          SEARCH PANEL
      ====================================================== */}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

        <div className="mb-5">

          <div className="flex items-center gap-2">

            <Search
              size={18}
              className="text-blue-400"
            />

            <h2 className="text-sm font-semibold text-white">
              IP Threat Intelligence Lookup
            </h2>

          </div>

          <p className="mt-1 text-xs text-slate-500">
            Query AbuseIPDB and VirusTotal for the same
            indicator.
          </p>

        </div>

        <div className="flex flex-col gap-3 md:flex-row">

          <div className="flex flex-1 items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">

            <Globe
              size={17}
              className="text-slate-500"
            />

            <input
              type="text"
              value={ip}
              onChange={(e) =>
                setIp(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Enter IP address e.g. 8.8.8.8"
              className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
            />

          </div>

          <button
            onClick={checkThreatFeeds}
            disabled={loading || analyzing}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading ? (
              <>
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />

                Checking...
              </>
            ) : (
              <>
                <Search size={16} />

                Check IP
              </>
            )}

          </button>

        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

      </div>

      {/* ======================================================
          FEED STATUS
      ====================================================== */}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

        <FeedStatus
          name="AbuseIPDB"
          description="IP abuse reports and confidence scoring"
          icon={<ShieldAlert size={19} />}
          active={true}
        />

        <FeedStatus
          name="VirusTotal"
          description="Multi-engine IP reputation analysis"
          icon={<ShieldCheck size={19} />}
          active={true}
        />

      </div>

      {/* ======================================================
          RESULTS
      ====================================================== */}

      {hasFeedResults && (

        <div className="mt-6">

          <div className="mb-4">

            <h2 className="text-sm font-semibold text-white">
              Intelligence Results
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Combined intelligence for{" "}
              <span className="font-mono text-slate-400">
                {ip}
              </span>
            </p>

          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* =================================================
                ABUSEIPDB
            ================================================= */}

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-6 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400">
                    <ShieldAlert size={19} />
                  </div>

                  <div>

                    <h3 className="text-sm font-semibold text-white">
                      AbuseIPDB
                    </h3>

                    <p className="text-xs text-slate-500">
                      Abuse reputation
                    </p>

                  </div>

                </div>

                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                  Connected
                </span>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <Metric
                  label="Confidence Score"
                  value={`${abuse?.abuseConfidenceScore ?? 0}%`}
                />

                <Metric
                  label="Total Reports"
                  value={String(
                    abuse?.totalReports ?? 0
                  )}
                />

                <Metric
                  label="Distinct Users"
                  value={String(
                    abuse?.numDistinctUsers ?? 0
                  )}
                />

                <Metric
                  label="Country"
                  value={
                    abuse?.countryCode ||
                    "Unknown"
                  }
                />

              </div>

              <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">

                <DetailRow
                  label="ISP"
                  value={abuse?.isp || "Unknown"}
                />

                <DetailRow
                  label="Domain"
                  value={
                    abuse?.domain || "Unknown"
                  }
                />

                <DetailRow
                  label="Usage Type"
                  value={
                    abuse?.usageType || "Unknown"
                  }
                />

                <DetailRow
                  label="Last Reported"
                  value={
                    abuse?.lastReportedAt ||
                    "Never"
                  }
                />

              </div>

            </div>

            {/* =================================================
                VIRUSTOTAL
            ================================================= */}

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-6 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                    <ShieldCheck size={19} />
                  </div>

                  <div>

                    <h3 className="text-sm font-semibold text-white">
                      VirusTotal
                    </h3>

                    <p className="text-xs text-slate-500">
                      Multi-engine reputation
                    </p>

                  </div>

                </div>

                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                  Connected
                </span>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <Metric
                  label="Malicious"
                  value={String(
                    virusTotalData?.malicious ?? 0
                  )}
                  danger={
                    (virusTotalData?.malicious ?? 0) >
                    0
                  }
                />

                <Metric
                  label="Suspicious"
                  value={String(
                    virusTotalData?.suspicious ?? 0
                  )}
                  warning={
                    (virusTotalData?.suspicious ?? 0) >
                    0
                  }
                />

                <Metric
                  label="Harmless"
                  value={String(
                    virusTotalData?.harmless ?? 0
                  )}
                />

                <Metric
                  label="Reputation"
                  value={String(
                    virusTotalData?.reputation ?? 0
                  )}
                />

              </div>

              <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">

                <DetailRow
                  label="Country"
                  value={
                    virusTotalData?.country ||
                    "Unknown"
                  }
                />

                <DetailRow
                  label="ASN"
                  value={
                    virusTotalData?.asn
                      ? `AS${virusTotalData.asn}`
                      : "Unknown"
                  }
                />

                <DetailRow
                  label="Network"
                  value={
                    virusTotalData?.network ||
                    "Unknown"
                  }
                />

                <DetailRow
                  label="Undetected"
                  value={String(
                    virusTotalData?.undetected ?? 0
                  )}
                />

              </div>

            </div>

          </div>

          {/* =================================================
              CORRELATION ANALYSIS ACTION
          ================================================= */}

          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                    <Activity size={19} />
                  </div>

                  <div>

                    <h3 className="text-sm font-semibold text-white">
                      Threat Correlation Analysis
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Correlate AbuseIPDB and VirusTotal
                      intelligence into a unified threat assessment.
                    </p>

                  </div>

                </div>

              </div>

              <button
                onClick={analyzeIndicator}
                disabled={analyzing || loading}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {analyzing ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />

                    Analyzing...
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} />

                    Analyze Indicator
                  </>
                )}

              </button>

            </div>

          </div>

          {/* =================================================
              ANALYSIS ERROR
          ================================================= */}

          {analysisError && (

            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">

              <div className="flex items-start gap-3">

                <AlertTriangle
                  size={18}
                  className="mt-0.5 text-red-400"
                />

                <div>

                  <p className="text-sm font-medium text-red-400">
                    Threat Analysis Failed
                  </p>

                  <p className="mt-1 text-xs text-red-300/80">
                    {analysisError}
                  </p>

                </div>

              </div>

            </div>

          )}

          {/* =================================================
              THREAT ANALYSIS RESULT
          ================================================= */}

          {analysisResult && (

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-xs uppercase tracking-widest text-blue-400">
                    Correlation Engine
                  </p>

                  <h2 className="mt-1 text-base font-semibold text-white">
                    Unified Threat Assessment
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Analysis generated for{" "}
                    <span className="font-mono text-slate-300">
                      {analysisResult.ip}
                    </span>
                  </p>

                </div>

                <span
                  className={`w-fit rounded-md border px-3 py-1.5 text-xs font-medium ${threatLevelClass(
                    analysisResult.threat_level
                  )}`}
                >
                  {analysisResult.threat_level}
                </span>

              </div>

              {/* SCORE CARDS */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <AnalysisMetric
                  label="Threat Score"
                  value={`${analysisResult.threat_score}/100`}
                />

                <AnalysisMetric
                  label="AbuseIPDB Reports"
                  value={String(
                    analysisResult.abuseipdb
                      ?.total_reports ?? 0
                  )}
                />

                <AnalysisMetric
                  label="Abuse Confidence"
                  value={`${analysisResult.abuseipdb
                    ?.confidence_score ?? 0}%`}
                />

              </div>

              {/* VIRUSTOTAL */}

              <div className="mt-6">

                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  VirusTotal Correlation
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                  <AnalysisMetric
                    label="Malicious"
                    value={String(
                      analysisResult.virustotal
                        ?.malicious ?? 0
                    )}
                    danger={
                      (analysisResult.virustotal
                        ?.malicious ?? 0) > 0
                    }
                  />

                  <AnalysisMetric
                    label="Suspicious"
                    value={String(
                      analysisResult.virustotal
                        ?.suspicious ?? 0
                    )}
                    warning={
                      (analysisResult.virustotal
                        ?.suspicious ?? 0) > 0
                    }
                  />

                  <AnalysisMetric
                    label="Harmless"
                    value={String(
                      analysisResult.virustotal
                        ?.harmless ?? 0
                    )}
                  />

                </div>

              </div>

              {/* RISK FACTORS */}

              {analysisResult.analysis
                ?.risk_factors &&
                analysisResult.analysis.risk_factors
                  .length > 0 && (

                  <div className="mt-6">

                    <div className="mb-3 flex items-center gap-2">

                      <ShieldAlert
                        size={17}
                        className="text-yellow-400"
                      />

                      <h3 className="text-sm font-semibold text-white">
                        Risk Factors
                      </h3>

                    </div>

                    <div className="space-y-2">

                      {analysisResult.analysis.risk_factors.map(
                        (factor, index) => (

                          <div
                            key={`${factor}-${index}`}
                            className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-300"
                          >
                            {factor}
                          </div>

                        )
                      )}

                    </div>

                  </div>

                )}

              {/* SECURITY ASSESSMENT */}

              {analysisResult.analysis
                ?.summary && (

                <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-5">

                  <div className="flex items-center gap-2">

                    <ShieldCheck
                      size={17}
                      className="text-emerald-400"
                    />

                    <h3 className="text-sm font-semibold text-white">
                      Security Assessment
                    </h3>

                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {analysisResult.analysis.summary}
                  </p>

                </div>

              )}

            </div>

          )}

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">

            <div className="flex items-center gap-3">

              <Activity
                size={18}
                className="text-blue-400"
              />

              <div>

                <h3 className="text-sm font-semibold text-white">
                  Feed Summary
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Combined source status
                </p>

              </div>

            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

              <SummaryItem
                icon={<Database size={17} />}
                title="Sources Queried"
                value="2"
              />

              <SummaryItem
                icon={<Shield size={17} />}
                title="Indicator"
                value={ip}
              />

              <SummaryItem
                icon={<Activity size={17} />}
                title="Status"
                value={
                  analysisResult
                    ? "Analysis Complete"
                    : "Feeds Queried"
                }
              />

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {!loading &&
        !abuseData &&
        !virusTotalData &&
        !error && (

          <div className="mt-6 flex h-80 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30">

            <div className="rounded-full bg-slate-900 p-4">

              <Database
                size={28}
                className="text-slate-600"
              />

            </div>

            <p className="mt-4 text-sm text-slate-500">
              No threat feed query performed
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Enter an IP address above to retrieve
              intelligence.
            </p>

          </div>

        )}

    </div>
  );
}

/* ============================================================
   FEED STATUS
============================================================ */

function FeedStatus({
  name,
  description,
  icon,
  active,
}: {
  name: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-5">

      <div className="flex items-center gap-3">

        <div className="rounded-lg bg-slate-800 p-2 text-slate-400">
          {icon}
        </div>

        <div>

          <h3 className="text-sm font-medium text-white">
            {name}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>

        </div>

      </div>

      <div className="flex items-center gap-2">

        <span
          className={`h-2 w-2 rounded-full ${
            active
              ? "bg-emerald-400"
              : "bg-red-400"
          }`}
        />

        <span
          className={`text-xs ${
            active
              ? "text-emerald-400"
              : "text-red-400"
          }`}
        >
          {active
            ? "Operational"
            : "Unavailable"}
        </span>

      </div>

    </div>
  );
}

/* ============================================================
   METRIC
============================================================ */

function Metric({
  label,
  value,
  danger,
  warning,
}: {
  label: string;
  value: string;
  danger?: boolean;
  warning?: boolean;
}) {
  let valueClass = "text-white";

  if (danger) {
    valueClass = "text-red-400";
  } else if (warning) {
    valueClass = "text-yellow-400";
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-semibold ${valueClass}`}
      >
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   ANALYSIS METRIC
============================================================ */

function AnalysisMetric({
  label,
  value,
  danger,
  warning,
}: {
  label: string;
  value: string;
  danger?: boolean;
  warning?: boolean;
}) {
  let valueClass = "text-white";

  if (danger) {
    valueClass = "text-red-400";
  } else if (warning) {
    valueClass = "text-yellow-400";
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-semibold ${valueClass}`}
      >
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="max-w-[65%] truncate text-right text-xs text-slate-300">
        {value}
      </span>

    </div>
  );
}

/* ============================================================
   SUMMARY ITEM
============================================================ */

function SummaryItem({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4">

      <div className="text-slate-500">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-xs text-slate-500">
          {title}
        </p>

        <p className="mt-1 truncate text-sm font-medium text-slate-200">
          {value}
        </p>

      </div>

    </div>
  );
}