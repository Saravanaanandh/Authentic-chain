"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiSearch, FiDownload, FiChevronLeft, FiChevronRight,
  FiShield, FiAlertTriangle, FiCheckCircle, FiXCircle,
  FiActivity, FiTarget, FiTrendingUp, FiHome, FiPlusCircle,
  FiGrid, FiClock, FiExternalLink, FiRefreshCw, FiCpu,
  FiInstagram, FiList
} from "react-icons/fi";


const platformIcons: Record<string, React.ReactNode> = {
  Instagram: <FiInstagram className="inline" />,
};

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

type Filter = "ALL" | "REAL" | "FAKE" | "SUSPICIOUS";

const sidebarLinks = [
  { href: "/",        label: "Home",     icon: FiHome },
  { href: "/instagram-analyzer", label: "New Scan", icon: FiPlusCircle },
  { href: "/dashboard", label: "Dashboard", icon: FiGrid },
  { href: "/dashboard/retrain", label: "ML Retraining", icon: FiCpu },
];


const resultBadge = {
  REAL:       { icon: FiCheckCircle, text: "REAL",       fg: "text-cyber-green", bg: "bg-cyber-green/10", border: "border-cyber-green/30" },
  FAKE:       { icon: FiXCircle,     text: "FAKE",       fg: "text-cyber-red",   bg: "bg-cyber-red/10",   border: "border-cyber-red/30" },
  SUSPICIOUS: { icon: FiAlertTriangle, text: "SUSPICIOUS", fg: "text-cyber-amber", bg: "bg-cyber-amber/10", border: "border-cyber-amber/30" },
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

  /* ---- Export CSV ---- */
  const exportCSV = () => {
    const header = "Username,Result,Risk Score,Date\n";
    const rows = profiles.map(p => `${p.username},${p.result},${p.riskScore},${new Date(p.date).toLocaleString()}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "dashboard_export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  /* ---- Pagination display helper ---- */
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
      <aside className="hidden lg:flex flex-col w-56 bg-surface-800/50 border-r border-brand-500/10 px-4 py-6 fixed inset-y-0 left-0 z-40">
        <div className="flex items-center gap-2 mb-2 px-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Verification Center</span>
        </div>
        <nav className="flex flex-col gap-1 mt-4">
          {sidebarLinks.map(link => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? "bg-brand-600/20 text-white border border-brand-500/30" : "text-slate-400 hover:text-white hover:bg-surface-700"}`}>
                <link.icon className={active ? "text-brand-400" : ""} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ===== Main Content ===== */}
      <div className="flex-1 lg:ml-56">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-xl border-b border-brand-500/10 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiShield className="text-brand-400 text-xl" />
            <span className="text-lg font-bold gradient-text hidden sm:inline">FakeID Shield</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <FiHome /> Home
            </Link>
            <Link href="/analyze" className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <FiPlusCircle /> New Scan
            </Link>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-600/20 text-brand-300 border border-brand-500/30">Dashboard</span>
          </div>
        </header>

        <main className="px-4 sm:px-8 py-8 space-y-6">
          {/* ---- Page Header ---- */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Verification Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">Monitor and manage historical profile integrity assessments.</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-500/20 text-slate-300 text-sm hover:bg-surface-700 transition-colors cursor-pointer">
                <FiDownload /> Export CSV
              </motion.button>
              <Link href="/analyze">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/25 cursor-pointer">
                  <FiShield /> New Verification
                </motion.button>
              </Link>
            </div>
          </div>

          {/* ---- Stats Cards ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Scans",          value: stats.totalProfiles, icon: FiTarget,     accent: "text-cyber-blue",  trend: "+12% from last week" },
              { label: "Threats Neutralized",   value: stats.fakeCount,    icon: FiAlertTriangle, accent: "text-cyber-red",   trend: `+5% alert rate` },
              { label: "Average Trust Score",   value: `${stats.avgTrustScore}%`, icon: FiCheckCircle, accent: "text-cyber-green", trend: "+2.1 pts improvement" },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-5 flex items-start justify-between group hover:border-brand-500/30 transition-all">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{card.label}</p>
                  <p className={`text-3xl font-black ${card.accent}`}>{card.value}</p>
                  <p className="text-[10px] text-cyber-green mt-2 flex items-center gap-1"><FiTrendingUp /> {card.trend}</p>
                </div>
                <div className={`p-2.5 rounded-lg bg-surface-700/50 ${card.accent}`}><card.icon className="text-xl" /></div>
              </motion.div>
            ))}
          </div>

          {/* ---- Filters & Search ---- */}
          <div className="glass-card p-4 flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Search username or scan ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-surface-800/60 border border-brand-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400 transition-all" />
            </div>
            {/* Refresh */}
            <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }} onClick={() => fetchData(pagination.page)} className="p-2.5 rounded-lg border border-brand-500/20 text-slate-400 hover:text-white transition-colors cursor-pointer">
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
            </motion.button>
          </div>

          {/* ---- Data Table ---- */}
          <div className="glass-card overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-brand-500/10 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              <div className="col-span-3">Profile Info</div>
              <div className="col-span-2 text-center">Detection Result</div>
              <div className="col-span-2 text-center">Risk Score</div>
              <div className="col-span-3">Scan Date</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <FiRefreshCw className="text-2xl text-brand-400 animate-spin" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-20">
                <FiGrid className="mx-auto text-3xl text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">No profiles found.</p>
                <Link href="/analyze" className="text-brand-400 text-xs hover:underline mt-1 inline-block">Analyze your first profile →</Link>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={`${pagination.page}-${search}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {profiles.map((p, i) => {
                    const b = resultBadge[p.result];
                    const Icon = b.icon;
                    const dt = new Date(p.date);
                    return (
                      <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center px-5 py-4 border-b border-brand-500/5 hover:bg-surface-800/30 transition-colors group">
                        {/* Profile Info */}
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600/30 to-cyber-purple/30 flex items-center justify-center text-white text-sm font-bold border border-brand-500/20 shrink-0">
                            {p.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">@{p.username}</p>
                            <p className="text-[10px] text-brand-300 font-mono mt-0.5 flex items-center gap-1">
                              {p.platform ? platformIcons[p.platform] : <FiList className="inline" />} {p.platform || "Unknown"}
                            </p>
                          </div>
                        </div>
                        {/* Result */}
                        <div className="col-span-2 flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${b.bg} ${b.fg} border ${b.border}`}>
                            <Icon className="text-xs" /> {b.text}
                          </span>
                        </div>
                        {/* Risk score */}
                        <div className="col-span-2 flex flex-col items-center gap-1">
                          <span className={`text-sm font-bold ${b.fg}`}>{Math.round(p.riskScore)}<span className="text-slate-500 font-normal">/100</span></span>
                          <div className="w-full max-w-[80px] h-1 rounded-full bg-surface-700 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${p.riskScore}%`, background: p.riskScore <= 30 ? "#10b981" : p.riskScore <= 60 ? "#f59e0b" : "#ef4444" }} />
                          </div>
                        </div>
                        {/* Date */}
                        <div className="col-span-3">
                          <p className="text-sm text-slate-300">{dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}</p>
                          <p className="text-[10px] text-slate-500">{dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        {/* Actions */}
                        <div className="col-span-2 flex justify-end gap-2">
                          <button title="View Blockchain Tx" className="p-1.5 rounded-lg text-slate-500 hover:text-cyber-green hover:bg-cyber-green/10 transition-colors cursor-pointer"><FiExternalLink size={14} /></button>
                          <button title="View Details" className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"><FiActivity size={14} /></button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}

            {/* ---- Pagination ---- */}
            {!loading && profiles.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-brand-500/10 gap-3">
                <p className="text-xs text-slate-500">
                  Showing <strong className="text-slate-300">{(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalFiltered)}</strong> of <strong className="text-slate-300">{pagination.totalFiltered}</strong> historical verifications
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => goPage(pagination.page - 1)} disabled={pagination.page <= 1} className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1">
                    <FiChevronLeft /> Previous
                  </button>
                  {pageNumbers().map((n, i) =>
                    typeof n === "string" ? (
                      <span key={`dots-${i}`} className="px-1.5 text-xs text-slate-600">…</span>
                    ) : (
                      <button key={n} onClick={() => goPage(n)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${pagination.page === n ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30" : "text-slate-400 hover:text-white hover:bg-surface-700"}`}>{n}</button>
                    )
                  )}
                  <button onClick={() => goPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1">
                    Next <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ---- Alert Banner ---- */}
          {stats.fakeCount > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-cyber-red/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyber-red/10 border border-cyber-red/30"><FiAlertTriangle className="text-cyber-red text-lg" /></div>
                <div>
                  <p className="text-sm font-semibold text-cyber-red">Threat Alert</p>
                  <p className="text-xs text-slate-400">{stats.fakeCount} fake profile{stats.fakeCount !== 1 ? "s" : ""} detected. Review flagged accounts for further action.</p>
                </div>
              </div>
              <Link href="/history">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="px-4 py-2 rounded-xl bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-xs font-semibold hover:bg-cyber-red/20 transition-colors cursor-pointer whitespace-nowrap">
                  Review Evidence
                </motion.button>
              </Link>
            </motion.div>
          )}

          {/* ---- Footer bar ---- */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-600 pt-4 border-t border-brand-500/5">
            <span>NETWORK: STABLE &nbsp; • &nbsp; API V1.0 &nbsp; • &nbsp; BUILD.{isMounted ? Math.floor(Date.now() / 100000) % 100 : "00"}</span>
            <span className="flex items-center gap-1"><FiClock /> Last refreshed: {isMounted ? currentTime : ""}</span>
          </div>
        </main>
      </div>
    </div>
  );
}
