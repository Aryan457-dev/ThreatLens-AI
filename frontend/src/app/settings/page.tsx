"use client";

import { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Database,
  Bell,
  SlidersHorizontal,
  Save,
  RotateCcw,
  CheckCircle2,
  Server,
} from "lucide-react";

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(
    "http://127.0.0.1:8000/api/v1"
  );

  const [timeout, setTimeoutValue] = useState("30");

  const [automaticAnalysis, setAutomaticAnalysis] =
    useState(true);

  const [correlationEngine, setCorrelationEngine] =
    useState(true);

  const [highRiskAlerts, setHighRiskAlerts] =
    useState(true);

  const [criticalAlerts, setCriticalAlerts] =
    useState(true);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const handleReset = () => {
    setApiUrl("http://127.0.0.1:8000/api/v1");
    setTimeoutValue("30");
    setAutomaticAnalysis(true);
    setCorrelationEngine(true);
    setHighRiskAlerts(true);
    setCriticalAlerts(true);
    setSaved(false);
  };

  return (
    <main className="min-h-screen w-full bg-slate-950 px-6 py-6 text-slate-200 lg:px-8">
      {/* PAGE HEADER */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />

            <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              Security Operations Center
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Settings
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Configure ThreatLens AI platform settings and integrations.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200"
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            {saved ? (
              <>
                <CheckCircle2 size={16} />
                Saved
              </>
            ) : (
              <>
                <Save size={16} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* MAIN SETTINGS GRID */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* API CONFIGURATION */}
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <SectionHeader
            icon={<KeyRound size={20} />}
            iconClass="bg-blue-500/10 text-blue-400"
            title="API Configuration"
            description="Backend and threat intelligence API settings"
          />

          <div className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Backend API URL
              </label>

              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Request Timeout
              </label>

              <select
                value={timeout}
                onChange={(e) => setTimeoutValue(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-200 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              >
                <option value="10">10 seconds</option>
                <option value="15">15 seconds</option>
                <option value="30">30 seconds</option>
                <option value="60">60 seconds</option>
                <option value="120">120 seconds</option>
              </select>
            </div>
          </div>
        </section>

        {/* THREAT INTELLIGENCE */}
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <SectionHeader
            icon={<ShieldCheck size={20} />}
            iconClass="bg-emerald-500/10 text-emerald-400"
            title="Threat Intelligence"
            description="Configure intelligence analysis behavior"
          />

          <div className="divide-y divide-slate-800">
            <ToggleRow
              title="Automatic Threat Analysis"
              description="Analyze new indicators automatically"
              enabled={automaticAnalysis}
              onChange={setAutomaticAnalysis}
            />

            <ToggleRow
              title="Correlation Engine"
              description="Enable IOC correlation analysis"
              enabled={correlationEngine}
              onChange={setCorrelationEngine}
            />
          </div>
        </section>

        {/* DATA SOURCES */}
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <SectionHeader
            icon={<Database size={20} />}
            iconClass="bg-purple-500/10 text-purple-400"
            title="Data Sources"
            description="Threat intelligence provider configuration"
          />

          <div className="space-y-4 p-6">
            <DataSource
              name="AbuseIPDB"
              description="IP reputation and abuse reports"
            />

            <DataSource
              name="VirusTotal"
              description="Multi-engine threat intelligence"
            />
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <SectionHeader
            icon={<Bell size={20} />}
            iconClass="bg-orange-500/10 text-orange-400"
            title="Notifications"
            description="Configure security notifications"
          />

          <div className="divide-y divide-slate-800">
            <ToggleRow
              title="High Risk IOC Alerts"
              description="Notify when high-risk indicators are detected"
              enabled={highRiskAlerts}
              onChange={setHighRiskAlerts}
            />

            <ToggleRow
              title="Critical IOC Alerts"
              description="Notify immediately for critical indicators"
              enabled={criticalAlerts}
              onChange={setCriticalAlerts}
            />
          </div>
        </section>
      </div>

      {/* PLATFORM STATUS */}
      <section className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        <SectionHeader
          icon={<SlidersHorizontal size={20} />}
          iconClass="bg-blue-500/10 text-blue-400"
          title="Platform Status"
          description="Current ThreatLens AI system configuration"
        />

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
          <StatusCard
            icon={<Server size={18} />}
            label="Backend"
            value="Operational"
          />

          <StatusCard
            icon={<Database size={18} />}
            label="IOC Database"
            value="Connected"
          />

          <StatusCard
            icon={<ShieldCheck size={18} />}
            label="Intelligence APIs"
            value="Operational"
          />
        </div>
      </section>

      {/* CONFIGURATION SUMMARY */}
      <section className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Configuration Summary
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Current runtime configuration
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            System Operational
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem
            label="Auto Analysis"
            value={automaticAnalysis ? "Enabled" : "Disabled"}
          />

          <SummaryItem
            label="Correlation"
            value={correlationEngine ? "Enabled" : "Disabled"}
          />

          <SummaryItem
            label="High Risk Alerts"
            value={highRiskAlerts ? "Enabled" : "Disabled"}
          />

          <SummaryItem
            label="Critical Alerts"
            value={criticalAlerts ? "Enabled" : "Disabled"}
          />
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  iconClass,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 p-6">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="font-semibold text-white">{title}</h2>

        <p className="mt-0.5 text-xs text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function ToggleRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 p-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-blue-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

/* =========================================================
   DATA SOURCE
========================================================= */

function DataSource({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">
          {name}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

        <span className="text-xs font-medium text-emerald-400">
          Connected
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS CARD
========================================================= */

function StatusCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-xs">{label}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />

        <span className="text-sm font-medium text-emerald-400">
          {value}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY ITEM
========================================================= */

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-2 text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}