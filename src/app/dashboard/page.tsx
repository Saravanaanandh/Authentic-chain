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
  FiEdit2, FiTrash2, FiSave, FiX
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

const sidebarLinks = [
  { href: "/",             label: "Home",            icon: FiHome },
  { href: "/dashboard",    label: "Dashboard",       icon: FiGrid },
  { href: "/dashboard#users",    label: "Users",     icon: FiUsers },
  { href: "/dashboard#feedback", label: "Feedback",  icon: FiMessageSquare },
  { href: "/dashboard#model-stats", label: "Model Statistics", icon: FiBarChart2 },
  { href: "/dashboard#blockchain",  label: "Blockchain Txns",  icon: FiLink },
  { href: "/dashboard#analytics",   label: "System Analytics", icon: FiSettings },
];

const resultBadge = {
  REAL:       { icon: FiCheckCircle, text: "REAL",       fg: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10", border: "border-green-200 dark:border-green-500/30" },
  FAKE:       { icon: FiXCircle,     text: "FAKE",       fg: "text-red-500",   bg: "bg-red-50 dark:bg-red-500/10",   border: "border-red-200 dark:border-red-500/30" },
  SUSPICIOUS: { icon: FiAlertTriangle, text: "SUSPICIOUS", fg: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/30" },
};

export default function DashboardPage() {
  const pathname = usePathname();
  const [profiles, setProfiles] = useState<DashboardProfile[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProfiles: 0, fakeCount: 0, realCount: 0, suspiciousCount: 0, avgTrustScore: 0 });
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
      setStats(data.stats || stats);
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

  return (
    <div className="flex min-h-screen">
      {/* ===== Sidebar ===== */}
      <aside className="hidden lg:flex flex-col w-56 bg-gray-50 dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 px-4 py-6 fixed inset-y-0 left-0 z-40">
        <div className="flex items-center gap-2 mb-2 px-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-1 mt-4">
          {sidebarLinks.map(link => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href.split("#")[0]) && link.href === "/dashboard");
            return (
              <Link key={link.label} href={link.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? "bg-black dark:bg-white text-white dark:text-black" : "text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800"}`}>
                <link.icon className="text-sm" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ===== Main Content ===== */}
      <div className="flex-1 lg:ml-56">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-200 dark:border-neutral-800 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiShield className="text-black dark:text-white text-xl" />
            <span className="text-lg font-bold text-black dark:text-white hidden sm:inline">Authentic Chain</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
              <FiHome /> Home
            </Link>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black dark:bg-white text-white dark:text-black">Admin</span>
          </div>
        </header>

        <main className="px-4 sm:px-8 py-8 space-y-6">
          {/* ---- Page Header ---- */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Monitor and manage profile verifications.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-500 text-sm hover:text-black dark:hover:text-white transition-colors cursor-pointer">
                <FiDownload /> Export CSV
              </button>
            </div>
          </div>

          {/* ---- Stats Cards ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Scans", value: stats.totalProfiles, icon: FiTarget, color: "text-black dark:text-white" },
              { label: "Threats Detected", value: stats.fakeCount, icon: FiAlertTriangle, color: "text-red-500" },
              { label: "Avg Trust Score", value: `${stats.avgTrustScore}%`, icon: FiCheckCircle, color: "text-green-500" },
            ].map((card, i) => (
              <div key={card.label} className="glass-card p-5 flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">{card.label}</p>
                  <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-neutral-800">
                  <card.icon className={`text-xl ${card.color}`} />
                </div>
              </div>
            ))}
          </div>

          {/* ---- Search ---- */}
          <div className="glass-card p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search username…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-black dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500 transition-all" />
            </div>
            <button onClick={() => fetchData(pagination.page)} className="p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* ---- Data Table ---- */}
          <div className="glass-card overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-200 dark:border-neutral-800 text-[11px] uppercase tracking-wider font-semibold text-gray-400">
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
                <FiGrid className="mx-auto text-3xl text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm">No profiles found.</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={`${pagination.page}-${search}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {profiles.map((p, i) => {
                    const b = resultBadge[p.result];
                    const Icon = b.icon;
                    const dt = new Date(p.date);
                    return (
                      <div key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center px-5 py-4 border-b border-gray-100 dark:border-neutral-800/50 hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-colors">
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-black dark:text-white text-sm font-bold">
                            {p.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-black dark:text-white">@{p.username}</p>
                            <p className="text-[10px] text-gray-400">{p.platform || "Instagram"}</p>
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          {editingId === p.username ? (
                            <select value={editVerdict} onChange={e => setEditVerdict(e.target.value)} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-[10px] rounded px-1 py-1 text-black dark:text-white" onClick={e => e.stopPropagation()}>
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
                              <div className="w-full max-w-[80px] h-1 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${p.riskScore}%`, background: p.riskScore <= 30 ? "#22c55e" : p.riskScore <= 60 ? "#f59e0b" : "#ef4444" }} />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="col-span-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300">{dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}</p>
                          <p className="text-[10px] text-gray-400">{dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        <div className="col-span-2 flex justify-end gap-1">
                          {editingId === p.username ? (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1.5 rounded-lg text-gray-400 hover:text-black dark:hover:text-white cursor-pointer" title="Cancel"><FiX size={14} /></button>
                              <button disabled={isActionLoading} onClick={(e) => handleSaveEdit(p.username, e)} className="p-1.5 rounded-lg text-green-500 cursor-pointer" title="Save"><FiSave size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={(e) => startEdit(p, e)} className="p-1.5 rounded-lg text-gray-400 hover:text-black dark:hover:text-white cursor-pointer" title="Edit"><FiEdit2 size={14} /></button>
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
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-neutral-800 gap-3">
                <p className="text-xs text-gray-400">
                  Showing <strong className="text-gray-600 dark:text-gray-300">{(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalFiltered)}</strong> of <strong className="text-gray-600 dark:text-gray-300">{pagination.totalFiltered}</strong>
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => goPage(pagination.page - 1)} disabled={pagination.page <= 1} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer flex items-center gap-1">
                    <FiChevronLeft /> Previous
                  </button>
                  {pageNumbers().map((n, i) =>
                    typeof n === "string" ? (
                      <span key={`dots-${i}`} className="px-1.5 text-xs text-gray-400">…</span>
                    ) : (
                      <button key={n} onClick={() => goPage(n)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${pagination.page === n ? "bg-black dark:bg-white text-white dark:text-black" : "text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800"}`}>{n}</button>
                    )
                  )}
                  <button onClick={() => goPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer flex items-center gap-1">
                    Next <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-400 pt-4 border-t border-gray-100 dark:border-neutral-800/50">
            <span>API V1.0 • BUILD.{isMounted ? Math.floor(Date.now() / 100000) % 100 : "00"}</span>
            <span className="flex items-center gap-1"><FiClock /> Last refreshed: {isMounted ? currentTime : ""}</span>
          </div>
        </main>
      </div>
    </div>
  );
}
