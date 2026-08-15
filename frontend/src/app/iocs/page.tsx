"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  ShieldAlert,
  RefreshCw,
  Eye,
  Trash2,
  X,
  Pencil,
} from "lucide-react";

type IOC = {
  id: number;
  value: string;
  type: string;
  source: string;
  threat_level: string;
  created_at?: string;
};

type NewIOC = {
  value: string;
  type: string;
  source: string;
  threat_level: string;
};

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

const API_URL = "http://127.0.0.1:8000";

export default function IOCIntelligence() {
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [threatFilter, setThreatFilter] = useState("ALL");

  // ============================================================
  // ADD IOC MODAL
  // ============================================================

  const [showAddModal, setShowAddModal] = useState(false);

  // ============================================================
  // EDIT IOC MODAL
  // ============================================================

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIOC, setEditingIOC] = useState<IOC | null>(null);
  const [editing, setEditing] = useState(false);

  // ============================================================
  // IOC DETAILS
  // ============================================================

  const [selectedIOC, setSelectedIOC] = useState<IOC | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // ============================================================
  // THREAT ANALYSIS
  // ============================================================

  const [analyzingIOC, setAnalyzingIOC] = useState(false);

  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResult | null>(null);

  const [analysisError, setAnalysisError] = useState("");

  // ============================================================
  // NEW IOC
  // ============================================================

  const [newIOC, setNewIOC] = useState<NewIOC>({
    value: "",
    type: "IP",
    source: "Manual",
    threat_level: "LOW",
  });

  // ============================================================
  // FETCH IOCS
  // ============================================================

  async function fetchIOCs() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("limit", "100");
      params.set("offset", "0");
      params.set("sort_by", "created_at");
      params.set("sort_order", "desc");

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (typeFilter !== "ALL") {
        params.set("type", typeFilter);
      }

      if (threatFilter !== "ALL") {
        params.set("threat_level", threatFilter);
      }

      const response = await fetch(
        `${API_URL}/api/v1/iocs?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error("IOC API error:", errorText);

        throw new Error(
          `Failed to fetch IOCs (${response.status})`
        );
      }

      const data = await response.json();

      setIocs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("IOC fetch error:", err);

      setError(
        "Unable to load IOC intelligence from the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchIOCs();
  }, [typeFilter, threatFilter]);

  // ============================================================
  // LOCAL SEARCH
  // ============================================================

  const filteredIOCs = useMemo(() => {
    if (!search.trim()) {
      return iocs;
    }

    const query = search.toLowerCase();

    return iocs.filter((ioc) => {
      return (
        ioc.value?.toLowerCase().includes(query) ||
        ioc.source?.toLowerCase().includes(query) ||
        ioc.type?.toLowerCase().includes(query)
      );
    });
  }, [iocs, search]);

  // ============================================================
  // ADD IOC
  // ============================================================

  async function addIOC() {
    const value = newIOC.value.trim();

    if (!value) {
      alert("Please enter an IOC value.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/v1/iocs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value,
            type: newIOC.type,
            source: newIOC.source.trim() || "Manual",
            threat_level: newIOC.threat_level,
          }),
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json().catch(() => null);

        console.error("Create IOC error:", errorData);

        throw new Error(
          errorData?.detail ||
            `Failed to create IOC (${response.status})`
        );
      }

      setShowAddModal(false);

      setNewIOC({
        value: "",
        type: "IP",
        source: "Manual",
        threat_level: "LOW",
      });

      await fetchIOCs();
    } catch (err) {
      console.error("Add IOC error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to create IOC."
      );
    }
  }

  // ============================================================
  // OPEN EDIT MODAL
  // ============================================================

  function openEditModal(ioc: IOC) {
    setEditingIOC({
      ...ioc,
    });

    setShowEditModal(true);
  }

  // ============================================================
  // CLOSE EDIT MODAL
  // ============================================================

  function closeEditModal() {
    if (editing) {
      return;
    }

    setShowEditModal(false);
    setEditingIOC(null);
  }

  // ============================================================
  // UPDATE IOC
  // ============================================================

  async function updateIOC() {
    if (!editingIOC) {
      return;
    }

    const value = editingIOC.value.trim();

    if (!value) {
      alert("Please enter an IOC value.");
      return;
    }

    try {
      setEditing(true);

      const response = await fetch(
        `${API_URL}/api/v1/iocs/${editingIOC.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value,
            type: editingIOC.type,
            source: editingIOC.source.trim() || "Manual",
            threat_level: editingIOC.threat_level,
          }),
        }
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Failed to update IOC (${response.status})`
        );
      }

      // Update local list immediately
      setIocs((current) =>
        current.map((ioc) =>
          ioc.id === editingIOC.id
            ? data
            : ioc
        )
      );

      // If this IOC is currently selected,
      // update the details view as well.
      if (selectedIOC?.id === editingIOC.id) {
        setSelectedIOC(data);
      }

      setShowEditModal(false);
      setEditingIOC(null);

      // Refresh from backend to ensure data is synchronized.
      await fetchIOCs();
    } catch (err) {
      console.error("Update IOC error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to update IOC."
      );
    } finally {
      setEditing(false);
    }
  }

  // ============================================================
  // DELETE IOC
  // ============================================================

  async function deleteIOC(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this IOC?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/v1/iocs/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to delete IOC (${response.status})`
        );
      }

      setIocs((current) =>
        current.filter((ioc) => ioc.id !== id)
      );

      if (selectedIOC?.id === id) {
        setSelectedIOC(null);
        setShowDetailsModal(false);
        setAnalysisResult(null);
        setAnalysisError("");
      }
    } catch (err) {
      console.error("Delete IOC error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to delete IOC."
      );
    }
  }

  // ============================================================
  // OPEN IOC DETAILS
  // ============================================================

  function openIOCDetails(ioc: IOC) {
    setSelectedIOC(ioc);
    setShowDetailsModal(true);

    setAnalysisResult(null);
    setAnalysisError("");
    setAnalyzingIOC(false);
  }

  // ============================================================
  // CLOSE IOC DETAILS
  // ============================================================

  function closeIOCDetails() {
    if (analyzingIOC) {
      return;
    }

    setShowDetailsModal(false);
    setSelectedIOC(null);
    setAnalysisResult(null);
    setAnalysisError("");
  }

  // ============================================================
  // THREAT BADGE
  // ============================================================

  function threatBadge(level: string) {
    const normalized = level?.toUpperCase();

    switch (normalized) {
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

  // ============================================================
  // ANALYZE IOC
  // ============================================================

  async function analyzeIOC() {
    if (!selectedIOC) {
      return;
    }

    if (selectedIOC.type.toUpperCase() !== "IP") {
      setAnalysisError(
        "Threat analysis currently supports IP addresses only."
      );
      return;
    }

    try {
      setAnalyzingIOC(true);
      setAnalysisError("");
      setAnalysisResult(null);

      const response = await fetch(
        `${API_URL}/api/v1/threat-analysis/${encodeURIComponent(
          selectedIOC.value
        )}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Analysis failed with status ${response.status}`
        );
      }

      setAnalysisResult(data);

      await fetchIOCs();
    } catch (err) {
      console.error("IOC analysis error:", err);

      setAnalysisError(
        err instanceof Error
          ? err.message
          : "Unable to analyze this indicator."
      );
    } finally {
      setAnalyzingIOC(false);
    }
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  const highRiskCount = iocs.filter((ioc) => {
    const level = ioc.threat_level?.toUpperCase();

    return (
      level === "HIGH" ||
      level === "CRITICAL"
    );
  }).length;

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-full bg-slate-950 px-6 pb-8 pt-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-blue-400">
            Security Operations Center
          </p>

          <h1 className="text-2xl font-semibold text-white">
            IOC Intelligence
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor, manage and investigate indicators of compromise.
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={fetchIOCs}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />

            Refresh
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            <Plus size={16} />

            Add IOC
          </button>

        </div>
      </div>

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

        <InfoCard
          title="Total IOCs"
          value={iocs.length.toString()}
          description="Tracked indicators"
        />

        <InfoCard
          title="Filtered Results"
          value={filteredIOCs.length.toString()}
          description="Matching current filters"
        />

        <InfoCard
          title="High Risk"
          value={highRiskCount.toString()}
          description="High / critical indicators"
        />

      </div>

      {/* ======================================================
          MAIN CARD
      ====================================================== */}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50">

        {/* ====================================================
            TOOLBAR
        ==================================================== */}

        <div className="border-b border-slate-800 p-5">

          <div className="flex flex-col gap-3 lg:flex-row">

            {/* SEARCH */}

            <div className="flex flex-1 items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">

              <Search
                size={17}
                className="text-slate-500"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search IOC, type or source..."
                className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
              />

            </div>

            {/* TYPE FILTER */}

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-300 outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="IP">IP</option>
              <option value="DOMAIN">Domain</option>
              <option value="URL">URL</option>
              <option value="HASH">Hash</option>
            </select>

            {/* THREAT FILTER */}

            <select
              value={threatFilter}
              onChange={(e) =>
                setThreatFilter(e.target.value)
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-300 outline-none"
            >
              <option value="ALL">
                All Threat Levels
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="LOW">
                Low
              </option>
            </select>

          </div>

        </div>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        {loading ? (

          <div className="flex h-72 items-center justify-center">

            <div className="flex items-center gap-3 text-sm text-slate-500">

              <RefreshCw
                size={17}
                className="animate-spin"
              />

              Loading IOC intelligence...

            </div>

          </div>

        ) : error ? (

          <div className="flex h-72 flex-col items-center justify-center">

            <ShieldAlert
              size={28}
              className="mb-3 text-red-400"
            />

            <p className="text-sm text-red-400">
              {error}
            </p>

            <button
              onClick={fetchIOCs}
              className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Try Again
            </button>

          </div>

        ) : filteredIOCs.length === 0 ? (

          <div className="flex h-72 flex-col items-center justify-center">

            <ShieldAlert
              size={28}
              className="mb-3 text-slate-600"
            />

            <p className="text-sm text-slate-500">
              No IOC records found
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Add an IOC or change your filters.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>

                <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-600">

                  <th className="px-6 py-4">
                    Indicator
                  </th>

                  <th className="px-6 py-4">
                    Type
                  </th>

                  <th className="px-6 py-4">
                    Source
                  </th>

                  <th className="px-6 py-4">
                    Threat Level
                  </th>

                  <th className="px-6 py-4">
                    Created
                  </th>

                  <th className="px-6 py-4 text-right">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredIOCs.map((ioc) => (

                  <tr
                    key={ioc.id}
                    className="border-b border-slate-800/70 transition hover:bg-slate-800/30"
                  >

                    <td className="px-6 py-4">

                      <span className="font-mono text-sm text-slate-200">
                        {ioc.value}
                      </span>

                    </td>

                    <td className="px-6 py-4">

                      <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-400">
                        {ioc.type}
                      </span>

                    </td>

                    <td className="px-6 py-4 text-sm text-slate-400">
                      {ioc.source}
                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`rounded-md border px-2 py-1 text-xs font-medium ${threatBadge(
                          ioc.threat_level
                        )}`}
                      >
                        {ioc.threat_level}
                      </span>

                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">

                      {ioc.created_at
                        ? new Date(
                            ioc.created_at
                          ).toLocaleDateString()
                        : "—"}

                    </td>

                    <td className="px-6 py-4">

                      <div className="flex justify-end gap-1">

                        {/* VIEW */}

                        <button
                          title="View IOC"
                          onClick={() =>
                            openIOCDetails(ioc)
                          }
                          className="rounded-md p-2 text-slate-500 transition hover:bg-slate-800 hover:text-blue-400"
                        >
                          <Eye size={16} />
                        </button>

                        {/* EDIT */}

                        <button
                          title="Edit IOC"
                          onClick={() =>
                            openEditModal(ioc)
                          }
                          className="rounded-md p-2 text-slate-500 transition hover:bg-slate-800 hover:text-yellow-400"
                        >
                          <Pencil size={16} />
                        </button>

                        {/* DELETE */}

                        <button
                          title="Delete IOC"
                          onClick={() =>
                            deleteIOC(ioc.id)
                          }
                          className="rounded-md p-2 text-slate-500 transition hover:bg-slate-800 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ======================================================
          ADD IOC MODAL
      ====================================================== */}

      {showAddModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">

              <div>

                <h2 className="text-base font-semibold text-white">
                  Add IOC
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Add a new indicator of compromise.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowAddModal(false)
                }
                className="rounded-md p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              >
                <X size={18} />
              </button>

            </div>

            <div className="space-y-4 p-6">

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  IOC Value
                </label>

                <input
                  value={newIOC.value}
                  onChange={(e) =>
                    setNewIOC({
                      ...newIOC,
                      value: e.target.value,
                    })
                  }
                  placeholder="e.g. 8.8.8.8"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Type
                </label>

                <select
                  value={newIOC.type}
                  onChange={(e) =>
                    setNewIOC({
                      ...newIOC,
                      type: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none"
                >
                  <option value="IP">IP</option>
                  <option value="DOMAIN">Domain</option>
                  <option value="URL">URL</option>
                  <option value="HASH">Hash</option>
                </select>

              </div>

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Source
                </label>

                <input
                  value={newIOC.source}
                  onChange={(e) =>
                    setNewIOC({
                      ...newIOC,
                      source: e.target.value,
                    })
                  }
                  placeholder="Manual"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Threat Level
                </label>

                <select
                  value={newIOC.threat_level}
                  onChange={(e) =>
                    setNewIOC({
                      ...newIOC,
                      threat_level: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none"
                >
                  <option value="LOW">
                    Low
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HIGH">
                    High
                  </option>

                  <option value="CRITICAL">
                    Critical
                  </option>

                </select>

              </div>

            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">

              <button
                onClick={() =>
                  setShowAddModal(false)
                }
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={addIOC}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                Add IOC
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          EDIT IOC MODAL
      ====================================================== */}

      {showEditModal && editingIOC && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeEditModal();
            }
          }}
        >

          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

              <div>

                <div className="flex items-center gap-2">

                  <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-400">
                    <Pencil size={17} />
                  </div>

                  <h2 className="text-base font-semibold text-white">
                    Edit IOC
                  </h2>

                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Update the indicator information.
                </p>

              </div>

              <button
                onClick={closeEditModal}
                disabled={editing}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40"
              >
                <X size={18} />
              </button>

            </div>

            {/* FORM */}

            <div className="space-y-4 p-6">

              {/* IOC VALUE */}

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  IOC Value
                </label>

                <input
                  value={editingIOC.value}
                  onChange={(e) =>
                    setEditingIOC({
                      ...editingIOC,
                      value: e.target.value,
                    })
                  }
                  placeholder="e.g. 8.8.8.8"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500"
                />

              </div>

              {/* TYPE */}

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Type
                </label>

                <select
                  value={editingIOC.type}
                  onChange={(e) =>
                    setEditingIOC({
                      ...editingIOC,
                      type: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-500"
                >

                  <option value="IP">
                    IP
                  </option>

                  <option value="DOMAIN">
                    Domain
                  </option>

                  <option value="URL">
                    URL
                  </option>

                  <option value="HASH">
                    Hash
                  </option>

                </select>

              </div>

              {/* SOURCE */}

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Source
                </label>

                <input
                  value={editingIOC.source}
                  onChange={(e) =>
                    setEditingIOC({
                      ...editingIOC,
                      source: e.target.value,
                    })
                  }
                  placeholder="Manual"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500"
                />

              </div>

              {/* THREAT LEVEL */}

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Threat Level
                </label>

                <select
                  value={editingIOC.threat_level}
                  onChange={(e) =>
                    setEditingIOC({
                      ...editingIOC,
                      threat_level: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-500"
                >

                  <option value="LOW">
                    Low
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HIGH">
                    High
                  </option>

                  <option value="CRITICAL">
                    Critical
                  </option>

                </select>

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">

              <button
                onClick={closeEditModal}
                disabled={editing}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={updateIOC}
                disabled={editing}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {editing ? (
                  <>
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil size={15} />

                    Save Changes
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          IOC DETAILS MODAL
      ====================================================== */}

      {showDetailsModal && selectedIOC && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeIOCDetails();
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-5">

              <div>

                <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
                  IOC Investigation
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Indicator Details
                </h2>

              </div>

              <button
                onClick={closeIOCDetails}
                disabled={analyzingIOC}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40"
              >
                <X size={18} />
              </button>

            </div>

            <div className="space-y-5 p-6">

              {/* INDICATOR */}

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Indicator
                </p>

                <p className="mt-2 break-all font-mono text-lg text-white">
                  {selectedIOC.value}
                </p>

              </div>

              {/* DETAILS */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <DetailItem
                  label="Type"
                  value={selectedIOC.type}
                />

                <DetailItem
                  label="Source"
                  value={selectedIOC.source}
                />

                <DetailItem
                  label="Threat Level"
                  value={selectedIOC.threat_level}
                  badge
                />

                <DetailItem
                  label="Created"
                  value={
                    selectedIOC.created_at
                      ? new Date(
                          selectedIOC.created_at
                        ).toLocaleString()
                      : "Unknown"
                  }
                />

              </div>

              {/* THREAT INTELLIGENCE */}

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

                <div className="mb-4 flex items-center gap-3">

                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                    <ShieldAlert size={18} />
                  </div>

                  <div>

                    <h3 className="text-sm font-semibold text-white">
                      Threat Intelligence
                    </h3>

                    <p className="text-xs text-slate-500">
                      Current IOC intelligence status
                    </p>

                  </div>

                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <div className="rounded-lg border border-slate-800 p-4">

                    <p className="text-xs text-slate-500">
                      Threat Level
                    </p>

                    <span
                      className={`mt-2 inline-block rounded-md border px-2 py-1 text-xs font-medium ${threatBadge(
                        selectedIOC.threat_level
                      )}`}
                    >
                      {selectedIOC.threat_level}
                    </span>

                  </div>

                  <div className="rounded-lg border border-slate-800 p-4">

                    <p className="text-xs text-slate-500">
                      Source
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-200">
                      {selectedIOC.source}
                    </p>

                  </div>

                  <div className="rounded-lg border border-slate-800 p-4">

                    <p className="text-xs text-slate-500">
                      IOC ID
                    </p>

                    <p className="mt-2 font-mono text-sm text-slate-200">
                      #{selectedIOC.id}
                    </p>

                  </div>

                </div>

              </div>

              {/* THREAT ANALYSIS */}

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <h3 className="text-sm font-semibold text-white">
                      Threat Analysis
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Query AbuseIPDB and VirusTotal for this indicator.
                    </p>

                  </div>

                  <button
                    onClick={analyzeIOC}
                    disabled={analyzingIOC}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {analyzingIOC ? (
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

              {/* ANALYSIS ERROR */}

              {analysisError && (

                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">

                  <div className="flex items-start gap-3">

                    <ShieldAlert
                      size={18}
                      className="mt-0.5 text-red-400"
                    />

                    <div>

                      <p className="text-sm font-medium text-red-400">
                        Analysis Failed
                      </p>

                      <p className="mt-1 text-xs leading-5 text-red-300/80">
                        {analysisError}
                      </p>

                    </div>

                  </div>

                </div>

              )}

              {/* ANALYSIS RESULT */}

              {analysisResult && (

                <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">

                  <div className="mb-5 flex items-center justify-between">

                    <div>

                      <h3 className="text-sm font-semibold text-white">
                        Analysis Result
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Combined threat intelligence assessment
                      </p>

                    </div>

                    <span
                      className={`rounded-md border px-2 py-1 text-xs font-medium ${threatBadge(
                        analysisResult.threat_level
                      )}`}
                    >
                      {analysisResult.threat_level}
                    </span>

                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                    <div className="rounded-lg border border-slate-800 p-4">

                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Threat Score
                      </p>

                      <p className="mt-2 text-2xl font-semibold text-white">
                        {analysisResult.threat_score}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Risk score out of 100
                      </p>

                    </div>

                    <div className="rounded-lg border border-slate-800 p-4">

                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        AbuseIPDB Reports
                      </p>

                      <p className="mt-2 text-2xl font-semibold text-white">
                        {analysisResult.abuseipdb?.total_reports ?? 0}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Total reports
                      </p>

                    </div>

                    <div className="rounded-lg border border-slate-800 p-4">

                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Abuse Confidence
                      </p>

                      <p className="mt-2 text-2xl font-semibold text-white">
                        {analysisResult.abuseipdb?.confidence_score ?? 0}%
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        AbuseIPDB confidence
                      </p>

                    </div>

                  </div>

                  {/* VIRUSTOTAL */}

                  <div className="mt-4">

                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                      VirusTotal Results
                    </p>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                      <MetricCard
                        label="Malicious"
                        value={
                          analysisResult.virustotal?.malicious ?? 0
                        }
                      />

                      <MetricCard
                        label="Suspicious"
                        value={
                          analysisResult.virustotal?.suspicious ?? 0
                        }
                      />

                      <MetricCard
                        label="Harmless"
                        value={
                          analysisResult.virustotal?.harmless ?? 0
                        }
                      />

                    </div>

                  </div>

                  {/* RISK FACTORS */}

                  {analysisResult.analysis?.risk_factors &&
                    analysisResult.analysis.risk_factors.length > 0 && (

                      <div className="mt-5">

                        <div className="mb-3 flex items-center gap-2">

                          <ShieldAlert
                            size={16}
                            className="text-yellow-400"
                          />

                          <p className="text-sm font-semibold text-white">
                            Risk Factors
                          </p>

                        </div>

                        <div className="space-y-2">

                          {analysisResult.analysis.risk_factors.map(
                            (factor, index) => (

                              <div
                                key={`${factor}-${index}`}
                                className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-300"
                              >
                                {factor}
                              </div>

                            )
                          )}

                        </div>

                      </div>

                    )}

                  {/* SECURITY ASSESSMENT */}

                  {analysisResult.analysis?.summary && (

                    <div className="mt-5 rounded-lg border border-slate-800 bg-slate-900 p-4">

                      <div className="flex items-center gap-2">

                        <ShieldAlert
                          size={16}
                          className="text-emerald-400"
                        />

                        <p className="text-sm font-semibold text-white">
                          Security Assessment
                        </p>

                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {analysisResult.analysis.summary}
                      </p>

                    </div>

                  )}

                </div>

              )}

            </div>

            <div className="flex justify-end border-t border-slate-800 px-6 py-4">

              <button
                onClick={closeIOCDetails}
                disabled={analyzingIOC}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

// ============================================================
// DETAIL ITEM
// ============================================================

function DetailItem({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">

      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>

      {badge ? (

        <span
          className={`mt-2 inline-block rounded-md border px-2 py-1 text-xs font-medium ${
            value.toUpperCase() === "CRITICAL"
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : value.toUpperCase() === "HIGH"
              ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
              : value.toUpperCase() === "MEDIUM"
              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {value}
        </span>

      ) : (

        <p className="mt-2 break-all text-sm text-slate-200">
          {value}
        </p>

      )}

    </div>
  );
}

// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-slate-800 p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-white">
        {value}
      </p>

    </div>
  );
}

// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">

      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-600">
        {description}
      </p>

    </div>
  );
}