"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type IOC = {
  id: number;
  value: string;
  type: string;
  source: string;
  threat_level: string;
  created_at?: string;
  updated_at?: string;
};

type AnalysisResult = {
  id?: number;
  ip?: string;
  risk_score?: number;
  threat_level?: string;
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  abuse_confidence_score?: number;
  vt_malicious?: number;
  vt_suspicious?: number;
  vt_harmless?: number;
  risk_factors?: string[];
  summary?: string;
  [key: string]: unknown;
};

type NewIOC = {
  value: string;
  type: string;
  source: string;
  threat_level: string;
};

export default function IOCIntelligence() {
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [threatFilter, setThreatFilter] = useState("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedIOC, setSelectedIOC] = useState<IOC | null>(null);
  const [editingIOC, setEditingIOC] = useState<IOC | null>(null);

  const [editing, setEditing] = useState(false);
  const [analyzingIOC, setAnalyzingIOC] = useState(false);

  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResult | null>(null);

  const [analysisError, setAnalysisError] = useState("");

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

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (typeFilter !== "ALL") {
        params.set("type", typeFilter);
      }

      if (threatFilter !== "ALL") {
        params.set("threat_level", threatFilter);
      }

      const query = params.toString();

      const data = await api.get(
        `/api/v1/iocs${query ? `?${query}` : ""}`
      );

      setIocs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("IOC fetch error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load IOC intelligence from the backend."
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
        ioc.type?.toLowerCase().includes(query) ||
        ioc.threat_level?.toLowerCase().includes(query)
      );
    });
  }, [iocs, search]);

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalIOCs = iocs.length;

  const highRiskIOCs = iocs.filter((ioc) => {
    const level = ioc.threat_level?.toUpperCase();

    return level === "HIGH" || level === "CRITICAL";
  }).length;

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
      await api.post("/api/v1/iocs", {
        value,
        type: newIOC.type,
        source: newIOC.source.trim() || "Manual",
        threat_level: newIOC.threat_level,
      });

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

      const data = await api.put(
        `/api/v1/iocs/${editingIOC.id}`,
        {
          value,
          type: editingIOC.type,
          source: editingIOC.source.trim() || "Manual",
          threat_level: editingIOC.threat_level,
        }
      );

      setIocs((current) =>
        current.map((ioc) =>
          ioc.id === editingIOC.id
            ? data
            : ioc
        )
      );

      if (selectedIOC?.id === editingIOC.id) {
        setSelectedIOC(data);
      }

      setShowEditModal(false);
      setEditingIOC(null);

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
      await api.delete(`/api/v1/iocs/${id}`);

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
  // TYPE BADGE
  // ============================================================

  function typeBadge(type: string) {
    return (
      <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400">
        {type}
      </span>
    );
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

      const data = await api.post(
        `/api/v1/threat-analysis/${encodeURIComponent(
          selectedIOC.value
        )}/analyze`
      );

      setAnalysisResult(data);

      await fetchIOCs();
    } catch (err) {
      console.error("IOC analysis error:", err);

      setAnalysisError(
        err instanceof Error
          ? err.message
          : "Threat analysis failed."
      );
    } finally {
      setAnalyzingIOC(false);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="min-h-screen bg-[#020617] px-6 py-8 text-white">
      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-400">
            Security Operations Center
          </div>

          <h1 className="text-3xl font-bold">
            IOC Intelligence
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor, manage and investigate indicators of compromise.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchIOCs}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ↻ Refresh
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            + Add IOC
          </button>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-[#0b1224] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total IOCs
          </p>

          <p className="mt-3 text-3xl font-bold">
            {totalIOCs}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Tracked indicators
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0b1224] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Filtered Results
          </p>

          <p className="mt-3 text-3xl font-bold">
            {filteredIOCs.length}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Matching current filters
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0b1224] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            High Risk
          </p>

          <p className="mt-3 text-3xl font-bold text-orange-400">
            {highRiskIOCs}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            High / critical indicators
          </p>
        </div>
      </div>

      {/* IOC TABLE */}

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#0b1224]">
        {/* FILTER BAR */}

        <div className="flex flex-col gap-3 border-b border-slate-800 p-5 lg:flex-row">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              ⌕
            </span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search IOC, type or source..."
              className="w-full rounded-lg border border-slate-800 bg-[#020617] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-[#020617] px-4 py-3 text-sm text-slate-200 outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="IP">IP</option>
            <option value="DOMAIN">Domain</option>
            <option value="URL">URL</option>
            <option value="HASH">Hash</option>
            <option value="EMAIL">Email</option>
          </select>

          <select
            value={threatFilter}
            onChange={(e) => setThreatFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-[#020617] px-4 py-3 text-sm text-slate-200 outline-none"
          >
            <option value="ALL">All Threat Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* ERROR */}

        {error && (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 text-4xl">⚠</div>

            <p className="mb-5 text-sm font-medium text-red-400">
              {error}
            </p>

            <button
              onClick={fetchIOCs}
              className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              Try Again
            </button>
          </div>
        )}

        {/* LOADING */}

        {!error && loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-sm text-slate-400">
              Loading IOC intelligence...
            </div>
          </div>
        )}

        {/* EMPTY */}

        {!error &&
          !loading &&
          filteredIOCs.length === 0 && (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 text-4xl text-slate-600">
                ◉
              </div>

              <h3 className="text-lg font-semibold">
                No IOCs found
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                {search ||
                typeFilter !== "ALL" ||
                threatFilter !== "ALL"
                  ? "Try changing your search or filters."
                  : "Add your first indicator of compromise to begin tracking threats."}
              </p>

              {!search &&
                typeFilter === "ALL" &&
                threatFilter === "ALL" && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500"
                  >
                    + Add IOC
                  </button>
                )}
            </div>
          )}

        {/* TABLE */}

        {!error &&
          !loading &&
          filteredIOCs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4">IOC</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Threat Level</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredIOCs.map((ioc) => (
                    <tr
                      key={ioc.id}
                      className="border-b border-slate-800/70 transition hover:bg-slate-900/60"
                    >
                      <td className="px-6 py-5">
                        <button
                          onClick={() => openIOCDetails(ioc)}
                          className="max-w-[300px] truncate text-left font-mono text-sm text-blue-400 hover:text-blue-300"
                        >
                          {ioc.value}
                        </button>
                      </td>

                      <td className="px-6 py-5">
                        {typeBadge(ioc.type)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-400">
                        {ioc.source || "Unknown"}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${threatBadge(
                            ioc.threat_level
                          )}`}
                        >
                          {ioc.threat_level || "LOW"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              openIOCDetails(ioc)
                            }
                            className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              openEditModal(ioc)
                            }
                            className="rounded-md border border-blue-500/30 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-500/10"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              deleteIOC(ioc.id)
                            }
                            className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {/* ========================================================
          ADD IOC MODAL
      ======================================================== */}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0b1224] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Add IOC
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a new indicator of compromise.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="text-xl text-slate-500 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-400">
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
                  className="w-full rounded-lg border border-slate-800 bg-[#020617] px-4 py-3 font-mono text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-400">
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
                    className="w-full rounded-lg border border-slate-800 bg-[#020617] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="IP">IP</option>
                    <option value="DOMAIN">Domain</option>
                    <option value="URL">URL</option>
                    <option value="HASH">Hash</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-400">
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
                    className="w-full rounded-lg border border-slate-800 bg-[#020617] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">
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
                  className="w-full rounded-lg border border-slate-800 bg-[#020617] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={addIOC}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500"
              >
                Add IOC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT IOC MODAL
      ======================================================== */}

      {showEditModal && editingIOC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0b1224] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Edit IOC
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update indicator information.
                </p>
              </div>

              <button
                onClick={closeEditModal}
                className="text-xl text-slate-500 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-400">
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
                  className="w-full rounded-lg border border-slate-800 bg-[#020617] px-4 py-3 font-mono text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-400">
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
                    className="w-full rounded-lg border border-slate-800 bg-[#020617] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="IP">IP</option>
                    <option value="DOMAIN">Domain</option>
                    <option value="URL">URL</option>
                    <option value="HASH">Hash</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-400">
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
                    className="w-full rounded-lg border border-slate-800 bg-[#020617] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">
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
                  className="w-full rounded-lg border border-slate-800 bg-[#020617] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                disabled={editing}
                className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={updateIOC}
                disabled={editing}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
              >
                {editing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          IOC DETAILS MODAL
      ======================================================== */}

      {showDetailsModal && selectedIOC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-800 bg-[#0b1224] p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-400">
                  IOC Investigation
                </div>

                <h2 className="break-all font-mono text-xl font-bold">
                  {selectedIOC.value}
                </h2>
              </div>

              <button
                onClick={closeIOCDetails}
                disabled={analyzingIOC}
                className="text-2xl text-slate-500 hover:text-white disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* IOC INFORMATION */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-[#020617] p-4">
                <p className="text-xs uppercase text-slate-500">
                  Type
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {selectedIOC.type}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#020617] p-4">
                <p className="text-xs uppercase text-slate-500">
                  Source
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {selectedIOC.source}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#020617] p-4">
                <p className="text-xs uppercase text-slate-500">
                  Threat Level
                </p>

                <span
                  className={`mt-2 inline-block rounded-md border px-2.5 py-1 text-xs font-medium ${threatBadge(
                    selectedIOC.threat_level
                  )}`}
                >
                  {selectedIOC.threat_level}
                </span>
              </div>
            </div>

            {/* ACTIONS */}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={analyzeIOC}
                disabled={analyzingIOC}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analyzingIOC
                  ? "Analyzing..."
                  : "Run Threat Analysis"}
              </button>

              <button
                onClick={() => {
                  closeIOCDetails();
                  openEditModal(selectedIOC);
                }}
                disabled={analyzingIOC}
                className="rounded-lg border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Edit IOC
              </button>
            </div>

            {/* ANALYSIS ERROR */}

            {analysisError && (
              <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {analysisError}
              </div>
            )}

            {/* ANALYSIS RESULT */}

            {analysisResult && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      Threat Analysis
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Correlated intelligence from available threat feeds.
                    </p>
                  </div>
                </div>

                {/* RISK SCORE */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded-lg border border-slate-800 bg-[#020617] p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Risk Score
                    </p>

                    <p className="mt-2 text-3xl font-bold text-blue-400">
                      {analysisResult.risk_score ?? 0}
                    </p>

                    <p className="text-xs text-slate-600">
                      out of 100
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-[#020617] p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Malicious
                    </p>

                    <p className="mt-2 text-3xl font-bold text-red-400">
                      {analysisResult.malicious ??
                        analysisResult.vt_malicious ??
                        0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-[#020617] p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Suspicious
                    </p>

                    <p className="mt-2 text-3xl font-bold text-yellow-400">
                      {analysisResult.suspicious ??
                        analysisResult.vt_suspicious ??
                        0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-[#020617] p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Harmless
                    </p>

                    <p className="mt-2 text-3xl font-bold text-emerald-400">
                      {analysisResult.harmless ??
                        analysisResult.vt_harmless ??
                        0}
                    </p>
                  </div>
                </div>

                {/* THREAT LEVEL */}

                {analysisResult.threat_level && (
                  <div className="mt-4 rounded-lg border border-slate-800 bg-[#020617] p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Correlated Threat Level
                    </p>

                    <span
                      className={`mt-2 inline-block rounded-md border px-3 py-1.5 text-sm font-medium ${threatBadge(
                        analysisResult.threat_level
                      )}`}
                    >
                      {analysisResult.threat_level}
                    </span>
                  </div>
                )}

                {/* SUMMARY */}

                {analysisResult.summary && (
                  <div className="mt-4 rounded-lg border border-slate-800 bg-[#020617] p-5">
                    <h4 className="mb-2 text-sm font-semibold">
                      Analysis Summary
                    </h4>

                    <p className="text-sm leading-6 text-slate-400">
                      {analysisResult.summary}
                    </p>
                  </div>
                )}

                {/* RISK FACTORS */}

                {Array.isArray(
                  analysisResult.risk_factors
                ) &&
                  analysisResult.risk_factors.length > 0 && (
                    <div className="mt-4 rounded-lg border border-slate-800 bg-[#020617] p-5">
                      <h4 className="mb-3 text-sm font-semibold">
                        Risk Factors
                      </h4>

                      <ul className="space-y-2">
                        {analysisResult.risk_factors.map(
                          (factor, index) => (
                            <li
                              key={index}
                              className="flex gap-3 text-sm text-slate-400"
                            >
                              <span className="text-red-400">
                                •
                              </span>

                              <span>{factor}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {/* FOOTER */}

            <div className="mt-8 flex justify-end">
              <button
                onClick={closeIOCDetails}
                disabled={analyzingIOC}
                className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}