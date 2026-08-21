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
} from "lucide-react";

import { api } from "../../lib/api";

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
  ip?: string;
  threat_score?: number;
  threat_level?: string;

  abuseipdb?: {
    confidence_score?: number;
    total_reports?: number;
  };

  virustotal?: {
    malicious?: number;
    suspicious?: number;
    harmless?: number;
  };

  analysis?: {
    risk_factors?: string[];
    summary?: string;
  };
};

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
    <div className="rounded-lg border border-slate-800 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className={`mt-2 text-xl font-semibold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

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

      <span className="break-all text-right text-sm text-slate-200">
        {value}
      </span>
    </div>
  );
}

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
    <div className="rounded-lg border border-slate-800 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-xs">
          {title}
        </span>
      </div>

      <p className="mt-3 break-all text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function ThreatLevelBadge({
  level,
}: {
  level?: string;
}) {
  switch (level?.toUpperCase()) {
    case "CRITICAL":
      return (
        <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400">
          CRITICAL
        </span>
      );

    case "HIGH":
      return (
        <span className="rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-400">
          HIGH
        </span>
      );

    case "MEDIUM":
      return (
        <span className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400">
          MEDIUM
        </span>
      );

    default:
      return (
        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
          LOW
        </span>
      );
  }
}

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
  const [analysisError, setAnalysisError] = useState("");

  // ============================================================
  // CHECK THREAT FEEDS
  // ============================================================

  async function checkThreatFeeds() {
    const cleanIP = ip.trim();

    if (!cleanIP) {
      setError("Please enter an IP address.");
      return;
    }

    setLoading(true);
    setError("");

    setAbuseData(null);
    setVirusTotalData(null);

    try {
      /*
       * api.get() automatically adds:
       *
       * Authorization: Bearer <JWT>
       */

      const [abuse, virusTotal] =
        await Promise.all([
          api.get(
            `/api/v1/threat-feed/check/${encodeURIComponent(
              cleanIP
            )}`
          ),

          api.get(
            `/api/v1/threat-feed/virustotal/${encodeURIComponent(
              cleanIP
            )}`
          ),
        ]);

      setAbuseData(abuse as AbuseResult);
      setVirusTotalData(
        virusTotal as VirusTotalResult
      );
    } catch (err) {
      console.error(
        "Threat feed error:",
        err
      );

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
    const cleanIP = ip.trim();

    if (!cleanIP) {
      setAnalysisError(
        "Please enter an IP address first."
      );
      return;
    }

    setAnalyzing(true);
    setAnalysisError("");
    setAnalysisResult(null);

    try {
      /*
       * Backend:
       *
       * GET /api/v1/threat-feed/analyze/{ip}
       *
       * JWT is automatically attached by api.ts.
       */

      const data = await api.get(
        `/api/v1/threat-feed/analyze/${encodeURIComponent(
          cleanIP
        )}`
      );

      setAnalysisResult(
        data as ThreatAnalysisResult
      );
    } catch (err) {
      console.error(
        "Threat analysis error:",
        err
      );

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
  // RESET
  // ============================================================

  function resetResults() {
    setIp("");
    setAbuseData(null);
    setVirusTotalData(null);
    setAnalysisResult(null);
    setError("");
    setAnalysisError("");
  }

  const abuse = abuseData?.data;

  const hasFeedResults =
    Boolean(abuseData || virusTotalData);

  const hasAnalysis =
    Boolean(analysisResult);

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

          <div className="relative flex-1">

            <Globe
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              type="text"
              value={ip}
              onChange={(e) =>
                setIp(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Enter IP address e.g. 8.8.8.8"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-blue-500"
            />

          </div>

          <button
            type="button"
            onClick={checkThreatFeeds}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading ? (
              <>
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />

                Querying...
              </>
            ) : (
              <>
                <Search size={17} />

                Check Feeds
              </>
            )}

          </button>

          {(hasFeedResults || hasAnalysis) && (
            <button
              type="button"
              onClick={resetResults}
              className="rounded-lg border border-slate-800 px-5 py-3 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white"
            >
              Reset
            </button>
          )}

        </div>

        {/* Error */}

        {error && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

            <ShieldAlert size={18} />

            <span>{error}</span>

          </div>
        )}

      </div>

      {/* ======================================================
          THREAT FEED RESULTS
      ====================================================== */}

      {hasFeedResults && !loading && (
        <div className="mt-6">

          <div className="mb-4 flex items-center justify-between">

            <div>

              <h2 className="text-sm font-semibold text-white">
                Intelligence Results
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Results returned for {ip}
              </p>

            </div>

            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
              Connected
            </span>

          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* ==================================================
                ABUSEIPDB
            =================================================== */}

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-5 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-lg bg-orange-500/10 p-2">

                    <ShieldAlert
                      size={19}
                      className="text-orange-400"
                    />

                  </div>

                  <div>

                    <h3 className="text-sm font-semibold text-white">
                      AbuseIPDB
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      IP reputation and abuse reports
                    </p>

                  </div>

                </div>

                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                  Connected
                </span>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <Metric
                  label="Confidence"
                  value={`${abuse?.abuseConfidenceScore ?? 0}%`}
                  danger={
                    (abuse?.abuseConfidenceScore ?? 0) >=
                    70
                  }
                  warning={
                    (abuse?.abuseConfidenceScore ?? 0) >=
                      30 &&
                    (abuse?.abuseConfidenceScore ?? 0) <
                      70
                  }
                />

                <Metric
                  label="Total Reports"
                  value={String(
                    abuse?.totalReports ?? 0
                  )}
                  danger={
                    (abuse?.totalReports ?? 0) > 0
                  }
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
                  label="IP Address"
                  value={
                    abuse?.ipAddress ||
                    ip
                  }
                />

                <DetailRow
                  label="ISP"
                  value={
                    abuse?.isp ||
                    "Unknown"
                  }
                />

                <DetailRow
                  label="Domain"
                  value={
                    abuse?.domain ||
                    "Unknown"
                  }
                />

                <DetailRow
                  label="Usage Type"
                  value={
                    abuse?.usageType ||
                    "Unknown"
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

            {/* ==================================================
                VIRUSTOTAL
            =================================================== */}

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">

              <div className="mb-5 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-lg bg-blue-500/10 p-2">

                    <ShieldCheck
                      size={19}
                      className="text-blue-400"
                    />

                  </div>

                  <div>

                    <h3 className="text-sm font-semibold text-white">
                      VirusTotal
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
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
                  label="IP Address"
                  value={
                    virusTotalData?.ip ||
                    ip
                  }
                />

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

          {/* ==================================================
              FEED SUMMARY
          =================================================== */}

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
                value="Analysis Complete"
              />

            </div>

          </div>

          {/* ==================================================
              CORRELATION ACTION
          =================================================== */}

          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>

                <div className="flex items-center gap-2">

                  <ShieldAlert
                    size={18}
                    className="text-blue-400"
                  />

                  <h3 className="text-sm font-semibold text-white">
                    Run Threat Correlation
                  </h3>

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Combine threat intelligence sources and
                  calculate an overall threat score.
                </p>

              </div>

              <button
                type="button"
                onClick={analyzeIndicator}
                disabled={analyzing}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {analyzing ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />

                    Analyzing...
                  </>
                ) : (
                  <>
                    <Activity size={17} />

                    Analyze Threat
                  </>
                )}

              </button>

            </div>

            {analysisError && (
              <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                {analysisError}
              </div>
            )}

          </div>

        </div>
      )}

      {/* ======================================================
          ANALYSIS RESULT
      ====================================================== */}

      {hasAnalysis && !analyzing && (
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <div className="flex items-center gap-2">

                <Activity
                  size={18}
                  className="text-blue-400"
                />

                <h2 className="text-sm font-semibold text-white">
                  Threat Correlation Result
                </h2>

              </div>

              <p className="mt-1 text-xs text-slate-500">
                Combined assessment for{" "}
                {analysisResult?.ip || ip}
              </p>

            </div>

            <ThreatLevelBadge
              level={
                analysisResult?.threat_level
              }
            />

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* Score */}

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

              <p className="text-xs text-slate-500">
                Threat Score
              </p>

              <p className="mt-2 text-3xl font-semibold text-white">
                {analysisResult?.threat_score ?? 0}
              </p>

            </div>

            {/* Abuse Confidence */}

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

              <p className="text-xs text-slate-500">
                AbuseIPDB Confidence
              </p>

              <p className="mt-2 text-3xl font-semibold text-white">
                {analysisResult?.abuseipdb?.confidence_score ?? 0}%
              </p>

            </div>

            {/* Reports */}

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

              <p className="text-xs text-slate-500">
                Abuse Reports
              </p>

              <p className="mt-2 text-3xl font-semibold text-white">
                {analysisResult?.abuseipdb?.total_reports ?? 0}
              </p>

            </div>

          </div>

          {/* VirusTotal */}

          <div className="mt-6">

            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              VirusTotal Detection
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              <Metric
                label="Malicious"
                value={String(
                  analysisResult?.virustotal?.malicious ??
                    0
                )}
                danger={
                  (analysisResult?.virustotal?.malicious ??
                    0) > 0
                }
              />

              <Metric
                label="Suspicious"
                value={String(
                  analysisResult?.virustotal?.suspicious ??
                    0
                )}
                warning={
                  (analysisResult?.virustotal?.suspicious ??
                    0) > 0
                }
              />

              <Metric
                label="Harmless"
                value={String(
                  analysisResult?.virustotal?.harmless ??
                    0
                )}
              />

            </div>

          </div>

          {/* Risk Factors */}

          <div className="mt-6">

            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Risk Factors
            </h3>

            {analysisResult?.analysis?.risk_factors
              ?.length ? (
              <div className="space-y-2">

                {analysisResult.analysis.risk_factors.map(
                  (factor, index) => (
                    <div
                      key={`${factor}-${index}`}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                    >
                      <span className="mr-3 text-xs font-semibold text-yellow-400">
                        {index + 1}.
                      </span>

                      {factor}
                    </div>
                  )
                )}

              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No significant risk factors identified.
              </p>
            )}

          </div>

          {/* Summary */}

          <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-5">

            <div className="flex items-center gap-2">

              <ShieldCheck
                size={17}
                className="text-emerald-400"
              />

              <h3 className="text-sm font-semibold text-white">
                Analyst Summary
              </h3>

            </div>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              {analysisResult?.analysis?.summary ||
                "No analysis summary available."}
            </p>

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

            <p className="mt-1 text-xs text-slate-700">
              Enter an IP address above to begin investigation.
            </p>

          </div>
        )}

    </div>
  );
}