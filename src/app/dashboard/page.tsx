"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiSearch, FiDownload, FiChevronLeft, FiChevronRight,
  FiShield, FiAlertTriangle, FiCheckCircle, FiXCircle,
  FiTarget, FiTrendingUp, FiHome,
  FiGrid, FiClock, FiRefreshCw,
  FiUsers, FiMessageSquare, FiGlobe, FiBarChart2, FiLink, FiSettings,
  FiEdit2, FiTrash2, FiSave, FiX, FiInfo, FiCpu, FiExternalLink, FiUserPlus
} from "react-icons/fi";

/* ---- Types ---- */
interface DashboardProfile {
  id: string; username: string; result: "REAL" | "SUSPICIOUS" | "FAKE";
  riskScore: number; date: string; blockchainTx: string; platform?: string;
}
interface Stats {
  totalProfiles: number; fakeCount: number; realCount: number;
  suspiciousCount: number; avgTrustScore: number;
}
interface Pagination { page: number; limit: number; totalFiltered: number; totalPages: number; }

const resultBadge = {
  REAL:       { icon: FiCheckCircle, text: "REAL",       fg: "text-green-500", bg: "bg-green-50/10", border: "border-green-500/30" },
  FAKE:       { icon: FiXCircle,     text: "FAKE",       fg: "text-red-500",   bg: "bg-red-50/10",   border: "border-red-500/30" },
  SUSPICIOUS: { icon: FiAlertTriangle, text: "SUSPICIOUS", fg: "text-amber-500", bg: "bg-amber-50/10", border: "border-amber-500/30" },
};

export default function DashboardPage() {
  const pathname = usePathname();
  const [currentTab, setCurrentTab] = useState("dashboard");

  const [profiles, setProfiles] = useState<DashboardProfile[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [blockchainTxns, setBlockchainTxns] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProfiles: 0, fakeCount: 0, realCount: 0, suspiciousCount: 0, avgTrustScore: 0 });
  const [modelStats, setModelStats] = useState<any>({ accuracy: 92, feedbackCount: 0, correctedCount: 0, analyzedCount: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, totalFiltered: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Admin edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVerdict, setEditVerdict] = useState<string>("");
  const [editScore, setEditScore] = useState<number>(0);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Model retrain state
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null);

  useEffect(() => setIsMounted(true), []);

  const fetchData = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(pg));
      params.set("limit", "10");
      const res = await fetch(`/api/dashboard?${params}`);
      const data = await res.json();
      setProfiles(data.profiles || []);
      setUsers(data.users || []);
      setFeedbacks(data.feedbacks || []);
      setBlockchainTxns(data.blockchainTxns || []);
      setStats(data.stats || stats);
      setModelStats(data.modelStats || modelStats);
      setPagination(data.pagination || pagination);
    } catch { /* empty */ }
    setLoading(false);
    setCurrentTime(new Date().toLocaleTimeString());
  }, [search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const goPage = (pg: number) => { if (pg >= 1 && pg <= pagination.totalPages) fetchData(pg); };

  const exportCSV = () => {
    const header = "Username,Result,Risk Score,Date\n";
    const rows = profiles.map(p => `${p.username},${p.result},${p.riskScore},${new Date(p.date).toLocaleString()}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "dashboard_export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (username: string) => {
    if (!confirm("Are you sure you want to permanently delete this profile?")) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(username)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchData(pagination.page);
    } catch (e) {
      console.error(e);
      alert("Failed to delete");
    }
    setIsActionLoading(false);
  };

  const startEdit = (p: DashboardProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(p.username);
    setEditVerdict(p.result === "FAKE" ? "HIGHLY FAKE" : p.result);
    setEditScore(p.riskScore);
  };

  const handleSaveEdit = async (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(username)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verdict: editVerdict, riskScore: editScore })
      });
      if (res.ok) {
        setEditingId(null);
        fetchData(pagination.page);
      } else {
        alert("Failed to update");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    }
    setIsActionLoading(false);
  };

  const handleToggleUserRole = async (email: string, currentRole: string) => {
    setIsActionLoading(true);
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: newRole })
      });
      if (res.ok) {
        fetchData(pagination.page);
      } else {
        alert("Failed to update user role");
      }
    } catch {
      alert("Error updating user role");
    }
    setIsActionLoading(false);
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${email}"?`)) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData(pagination.page);
      } else {
        alert("Failed to delete user");
      }
    } catch {
      alert("Error deleting user");
    }
    setIsActionLoading(false);
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this feedback entry?")) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/feedback?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData(pagination.page);
      } else {
        alert("Failed to delete feedback");
      }
    } catch {
      alert("Error deleting feedback");
    }
    setIsActionLoading(false);
  };

  const handleRetrainModel = async () => {
    setRetrainLoading(true);
    setRetrainMsg(null);
    try {
      const res = await fetch("/api/model/retrain", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRetrainMsg(data.message || `Model retrained successfully. Version: ${data.version}`);
        fetchData(pagination.page);
      } else {
        setRetrainMsg(`Retraining failed: ${data.error || "Unknown error"}`);
      }
    } catch {
      setRetrainMsg("Retraining error: check server logs.");
    }
    setRetrainLoading(false);
  };

  const pageNumbers = () => {
    const pages: (number | string)[] = [];
    const { page, totalPages } = pagination;
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const sidebarLinks = [
    { id: "dashboard",    label: "Dashboard",       icon: FiGrid },
    { id: "users",        label: "Users",           icon: FiUsers },
    { id: "feedback",     label: "Feedback",        icon: FiMessageSquare },
    { id: "model-stats",  label: "Model Statistics",icon: FiBarChart2 },
    { id: "blockchain",   label: "Blockchain Txns", icon: FiLink },
    { id: "analytics",    label: "System Settings", icon: FiSettings },
  ];

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* ===== Sidebar ===== */}
      <aside className="hidden lg:flex flex-col w-60 bg-neutral-950 border-r border-neutral-800 px-4 py-6 fixed inset-y-0 left-0 z-40">
        <div className="flex items-center gap-2 mb-2 px-2">
          <FiShield className="text-white text-lg" />
          <span className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-1 mt-6">
          {sidebarLinks.map(link => {
            const active = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setCurrentTab(link.id);
                  setEditingId(null);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer w-full ${active ? "bg-white text-black font-semibold" : "text-gray-400 hover:text-white hover:bg-neutral-900"}`}
              >
                <link.icon className="text-sm" />
                {link.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ===== Main Content ===== */}
      <div className="flex-1 lg:ml-60">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-neutral-800 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <FiShield className="text-white text-xl" />
            <span className="text-lg font-bold text-white">Authentic Chain</span>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">Role: Administrator</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <FiHome /> Home
            </Link>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-black">Admin</span>
          </div>
        </header>

        <main className="px-4 sm:px-8 py-8 space-y-6">
          {/* Dashboard Tab Panels */}
          {currentTab === "dashboard" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white">Dashboard Overview</h1>
                  <p className="text-sm text-gray-400 mt-1">Monitor profile verifications and scan metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-800 text-gray-400 text-sm hover:text-white transition-colors cursor-pointer bg-neutral-900">
                    <FiDownload /> Export CSV
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Total Scans", value: stats.totalProfiles, icon: FiTarget, color: "text-white" },
                  { label: "Threats Detected", value: stats.fakeCount, icon: FiAlertTriangle, color: "text-red-500" },
                  { label: "Avg Trust Score", value: `${stats.avgTrustScore}%`, icon: FiCheckCircle, color: "text-green-500" },
                ].map((card) => (
                  <div key={card.label} className="glass-card p-5 flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">{card.label}</p>
                      <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-neutral-900">
                      <card.icon className={`text-xl ${card.color}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Search */}
              <div className="glass-card p-4 flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search username…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-neutral-600 transition-all" />
                </div>
                <button onClick={() => fetchData(pagination.page)} className="p-2.5 rounded-lg border border-neutral-800 text-gray-400 hover:text-white transition-colors cursor-pointer bg-neutral-900">
                  <FiRefreshCw className={loading ? "animate-spin" : ""} />
                </button>
              </div>

              {/* Data Table */}
              <div className="glass-card overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-neutral-800 text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                  <div className="col-span-3">Profile</div>
                  <div className="col-span-2 text-center">Result</div>
                  <div className="col-span-2 text-center">Risk Score</div>
                  <div className="col-span-3">Date</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <FiRefreshCw className="text-2xl text-gray-400 animate-spin" />
                  </div>
                ) : profiles.length === 0 ? (
                  <div className="text-center py-20">
                    <FiGrid className="mx-auto text-3xl text-neutral-600 mb-3" />
                    <p className="text-gray-400 text-sm">No profiles found.</p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={`${pagination.page}-${search}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {profiles.map((p) => {
                        const b = resultBadge[p.result] || resultBadge.SUSPICIOUS;
                        const Icon = b.icon;
                        const dt = new Date(p.date);
                        return (
                          <div key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center px-5 py-4 border-b border-neutral-800/50 hover:bg-neutral-900/40 transition-colors">
                            <div className="col-span-3 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-white text-sm font-bold">
                                {p.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">@{p.username}</p>
                                <p className="text-[10px] text-gray-400">{p.platform || "Instagram"}</p>
                              </div>
                            </div>
                            <div className="col-span-2 flex justify-center">
                              {editingId === p.username ? (
                                <select value={editVerdict} onChange={e => setEditVerdict(e.target.value)} className="bg-neutral-900 border border-neutral-700 text-[10px] rounded px-1.5 py-1 text-white" onClick={e => e.stopPropagation()}>
                                  <option value="REAL">REAL</option>
                                  <option value="SUSPICIOUS">SUSPICIOUS</option>
                                  <option value="HIGHLY FAKE">FAKE</option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${b.bg} ${b.fg} border ${b.border}`}>
                                  <Icon className="text-xs" /> {b.text}
                                </span>
                              )}
                            </div>
                            <div className="col-span-2 flex flex-col items-center gap-1">
                              {editingId === p.username ? (
                                <input type="range" min="0" max="100" value={editScore} onChange={e => setEditScore(Number(e.target.value))} className="w-16" onClick={e => e.stopPropagation()} />
                              ) : (
                                <>
                                  <span className={`text-sm font-bold ${b.fg}`}>{Math.round(p.riskScore)}<span className="text-gray-400 font-normal">/100</span></span>
                                  <div className="w-full max-w-[80px] h-1 rounded-full bg-neutral-800 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${p.riskScore}%`, background: p.riskScore <= 30 ? "#22c55e" : p.riskScore <= 60 ? "#f59e0b" : "#ef4444" }} />
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="col-span-3">
                              <p className="text-sm text-gray-300">{dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}</p>
                              <p className="text-[10px] text-gray-400">{dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                            <div className="col-span-2 flex justify-end gap-1">
                              {editingId === p.username ? (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1.5 rounded-lg text-gray-400 hover:text-white cursor-pointer" title="Cancel"><FiX size={14} /></button>
                                  <button disabled={isActionLoading} onClick={(e) => handleSaveEdit(p.username, e)} className="p-1.5 rounded-lg text-green-500 cursor-pointer" title="Save"><FiSave size={14} /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={(e) => startEdit(p, e)} className="p-1.5 rounded-lg text-gray-400 hover:text-white cursor-pointer" title="Edit"><FiEdit2 size={14} /></button>
                                  <button disabled={isActionLoading} onClick={(e) => { e.stopPropagation(); handleDelete(p.username); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 cursor-pointer" title="Delete"><FiTrash2 size={14} /></button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* Pagination */}
                {!loading && profiles.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-neutral-800 gap-3">
                    <p className="text-xs text-gray-400">
                      Showing <strong className="text-gray-300">{(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalFiltered)}</strong> of <strong className="text-gray-300">{pagination.totalFiltered}</strong>
                    </p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => goPage(pagination.page - 1)} disabled={pagination.page <= 1} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer flex items-center gap-1 bg-neutral-900">
                        <FiChevronLeft /> Previous
                      </button>
                      {pageNumbers().map((n, i) =>
                        typeof n === "string" ? (
                          <span key={`dots-${i}`} className="px-1.5 text-xs text-gray-400">…</span>
                        ) : (
                          <button key={n} onClick={() => goPage(n)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${pagination.page === n ? "bg-white text-black" : "text-gray-400 hover:text-white hover:bg-neutral-900"}`}>{n}</button>
                        )
                      )}
                      <button onClick={() => goPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer flex items-center gap-1 bg-neutral-900">
                        Next <FiChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === "users" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Users</h1>
                <p className="text-sm text-gray-400 mt-1">Manage application users and security roles.</p>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-neutral-800 text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                  <div className="col-span-3">User Details</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2 text-center">Provider</div>
                  <div className="col-span-2 text-center">Role</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {users.length === 0 ? (
                  <div className="text-center py-20">
                    <FiUsers className="mx-auto text-3xl text-neutral-600 mb-3" />
                    <p className="text-gray-400 text-sm">No registered users found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800">
                    {users.map((u) => (
                      <div key={u.email} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center px-5 py-4 hover:bg-neutral-900/40 transition-all">
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-white text-xs">
                            {u.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-white">{u.name}</span>
                            <span className="block text-[10px] text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="col-span-3 text-sm text-gray-300 font-mono break-all">{u.email}</div>
                        <div className="col-span-2 text-center text-xs uppercase text-gray-400">{u.authProvider}</div>
                        <div className="col-span-2 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === "admin" ? "bg-white text-black" : "bg-neutral-800 text-gray-400"}`}>
                            {u.role}
                          </span>
                        </div>
                        <div className="col-span-2 flex justify-end gap-2">
                          <button
                            onClick={() => handleDeleteUser(u.email)}
                            disabled={isActionLoading}
                            className="p-1.5 rounded bg-neutral-900 border border-neutral-800 hover:border-red-500/50 hover:bg-red-500/10 text-red-500 cursor-pointer"
                            title="Delete User"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === "feedback" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Model Feedback</h1>
                <p className="text-sm text-gray-400 mt-1">Review feedback logs submitted by verified users.</p>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-neutral-800 text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                  <div className="col-span-2">Profile</div>
                  <div className="col-span-2 text-center">Original Prediction</div>
                  <div className="col-span-2 text-center">User Correction</div>
                  <div className="col-span-3">Feedback Reason</div>
                  <div className="col-span-2">Notes</div>
                  <div className="col-span-1 text-right">Delete</div>
                </div>

                {feedbacks.length === 0 ? (
                  <div className="text-center py-20">
                    <FiMessageSquare className="mx-auto text-3xl text-neutral-600 mb-3" />
                    <p className="text-gray-400 text-sm">No feedback entries recorded.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800">
                    {feedbacks.map((f) => (
                      <div key={f._id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center px-5 py-4 hover:bg-neutral-900/40 transition-all">
                        <div className="col-span-2">
                          <span className="text-sm font-semibold text-white">@{f.username}</span>
                          <span className="block text-[10px] text-gray-500 font-mono">{f.submittedBy || "anonymous"}</span>
                        </div>
                        <div className="col-span-2 text-center text-xs font-semibold text-red-400">{f.originalPrediction} ({f.originalFakeProbability}%)</div>
                        <div className="col-span-2 text-center">
                          <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">
                            {f.userCorrectedLabel}
                          </span>
                        </div>
                        <div className="col-span-3 text-xs text-gray-300 font-medium">{f.feedbackReason}</div>
                        <div className="col-span-2 text-xs text-gray-400 font-mono truncate">{f.notes || "—"}</div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => handleDeleteFeedback(f._id)}
                            disabled={isActionLoading}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === "model-stats" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Model Statistics</h1>
                <p className="text-sm text-gray-400 mt-1">Review deep-learning performance metrics and execute retraining pipelines.</p>
              </div>

              {/* Model KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Predictive Accuracy", value: `${modelStats.accuracy}%`, icon: FiTarget, color: "text-green-500" },
                  { label: "Feedback Received", value: modelStats.feedbackCount, icon: FiMessageSquare, color: "text-blue-400" },
                  { label: "Corrected Labels", value: modelStats.correctedCount, icon: FiAlertTriangle, color: "text-amber-500" },
                  { label: "Profiles Analyzed", value: modelStats.analyzedCount, icon: FiCpu, color: "text-white" },
                ].map((kpi) => (
                  <div key={kpi.label} className="glass-card p-5">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{kpi.label}</p>
                      <kpi.icon className={`text-lg ${kpi.color}`} />
                    </div>
                    <p className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Retrain Panel */}
              <div className="glass-card p-6 md:p-8 space-y-6 bg-gradient-to-br from-neutral-900 to-black">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white text-black">
                    <FiCpu className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Advanced Model Retraining</h3>
                    <p className="text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
                      Retrain the local XGBoost and Anomaly Detection (Isolation Forest) models using historical profile scan metrics combined with validated user corrections.
                    </p>
                  </div>
                </div>

                <div className="border-t border-neutral-800 pt-6 flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={handleRetrainModel}
                    disabled={retrainLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white hover:bg-gray-200 text-black font-semibold text-sm cursor-pointer disabled:opacity-50"
                  >
                    {retrainLoading ? (
                      <>
                        <FiRefreshCw className="animate-spin" />
                        <span>Retraining Pipeline Running...</span>
                      </>
                    ) : (
                      <>
                        <FiCpu />
                        <span>Execute Retraining</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500">Takes approximately 3-5 seconds to compute corrections.</p>
                </div>

                {retrainMsg && (
                  <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono text-gray-300">
                    <FiInfo className="inline mr-2 text-white" />
                    {retrainMsg}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === "blockchain" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Blockchain Transactions</h1>
                <p className="text-sm text-gray-400 mt-1">Audit transaction logs and tamper-proof hashes anchored on Sepolia Ethereum network.</p>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-neutral-800 text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                  <div className="col-span-2">Scanned Profile</div>
                  <div className="col-span-4">Verification Hash</div>
                  <div className="col-span-4">Transaction Hash</div>
                  <div className="col-span-2 text-right">Etherscan Link</div>
                </div>

                {blockchainTxns.length === 0 ? (
                  <div className="text-center py-20">
                    <FiLink className="mx-auto text-3xl text-neutral-600 mb-3" />
                    <p className="text-gray-400 text-sm">No transaction records generated.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800">
                    {blockchainTxns.map((t) => (
                      <div key={t.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center px-5 py-4 hover:bg-neutral-900/40 transition-all">
                        <div className="col-span-2">
                          <span className="text-sm font-semibold text-white">@{t.username}</span>
                          <span className="block text-[10px] text-gray-500">{new Date(t.date).toLocaleDateString()}</span>
                        </div>
                        <div className="col-span-4 text-xs font-mono text-gray-400 break-all">{t.blockchainHash}</div>
                        <div className="col-span-4 text-xs font-mono text-gray-400 break-all">{t.blockchainTx}</div>
                        <div className="col-span-2 flex justify-end">
                          <a
                            href={`https://sepolia.etherscan.io/tx/${t.blockchainTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-medium hover:border-neutral-600 text-gray-300"
                          >
                            <FiExternalLink /> Etherscan
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-white">System Settings</h1>
                <p className="text-sm text-gray-400 mt-1">Audit services configuration and backend microservice environments.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Integration Health */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FiSettings className="text-gray-400" />
                    Integration Status
                  </h3>
                  <div className="space-y-3">
                    {[
                      { service: "MongoDB Database", status: "Online", desc: "Connected to Cluster0/authenticchaindb" },
                      { service: "FastAPI ML Server", status: "Online", desc: "Predict-profile microservice online" },
                      { service: "Sepolia Testnet RPC", status: "Active", desc: "Etherscan ledger synchronization" },
                      { service: "Apify Scraper Engine", status: "Active", desc: "Instagram actor endpoint query limits" },
                    ].map((s) => (
                      <div key={s.service} className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
                        <div>
                          <p className="text-sm font-semibold text-white">{s.service}</p>
                          <p className="text-[10px] text-gray-500">{s.desc}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-bold uppercase border border-green-500/20">
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Variables */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FiInfo className="text-gray-400" />
                    System Information
                  </h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex justify-between py-1 border-b border-neutral-800">
                      <span>Server Engine</span>
                      <span className="text-white font-medium">Next.js 15.5.15 (V8 Runtime)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-800">
                      <span>Database Engine</span>
                      <span className="text-white font-medium">MongoDB v8.0 (Mongoose v9.5)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-800">
                      <span>Tabular ML Model</span>
                      <span className="text-white font-medium">XGBClassifier / ensemble_models</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Anomaly Model</span>
                      <span className="text-white font-medium">IsolationForest / anomaly_models</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Time Log */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 pt-4 border-t border-neutral-800/50">
            <span>API V1.0 • SYSTEM ACTIVE</span>
            <span className="flex items-center gap-1"><FiClock /> Last refreshed: {isMounted ? currentTime : ""}</span>
          </div>
        </main>
      </div>
    </div>
  );
}
