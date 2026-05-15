"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FiRefreshCw, FiSearch, FiCheckCircle, FiAlertTriangle, FiXCircle, FiHash, FiLink, FiUsers, FiFileText, FiClock, FiDatabase, FiImage, FiTrendingUp, FiInstagram, FiList } from "react-icons/fi";

interface Profile {
  id: string; username: string; followers: number; posts: number;
  accountAge: string; bio: string; imageHash: string; imageUrl: string;
  dataHash: string; riskScore: number; result: "REAL" | "SUSPICIOUS" | "FAKE";
  blockchainTx: string; createdAt: string; analyzedBy?: string[]; platform?: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  Instagram: <FiInstagram className="inline" />,
};

const badge = {
  REAL: { icon: FiCheckCircle, color: "text-cyber-green", bg: "bg-cyber-green/10", border: "border-cyber-green/30" },
  SUSPICIOUS: { icon: FiAlertTriangle, color: "text-cyber-amber", bg: "bg-cyber-amber/10", border: "border-cyber-amber/30" },
  FAKE: { icon: FiXCircle, color: "text-cyber-red", bg: "bg-cyber-red/10", border: "border-cyber-red/30" },
};

export default function HistoryPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "user";
  const userEmail = session?.user?.email || "";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Tabs: 'my' or 'global'. If admin, default to 'global'
  const [activeTab, setActiveTab] = useState<"my" | "global">(userRole === "admin" ? "global" : "my");

  // Force admin to stay on global
  useEffect(() => {
    if (userRole === "admin" && activeTab !== "global") {
      setActiveTab("global");
    }
  }, [userRole, activeTab]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/profiles");
      const d = await r.json();
      setProfiles(d.profiles || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filter by tab
  const tabFiltered = useMemo(() => {
    if (activeTab === "my" && userRole !== "admin") {
      return profiles.filter(p => p.analyzedBy?.includes(userEmail));
    }
    return profiles;
  }, [profiles, activeTab, userEmail, userRole]);

  const filtered = tabFiltered.filter((p) => {
    const matchesSearch = p.username.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Global Most Analyzed Profile
  const mostAnalyzedProfile = useMemo(() => {
    if (profiles.length === 0) return null;
    return [...profiles].sort((a, b) => (b.analyzedBy?.length || 0) - (a.analyzedBy?.length || 0))[0];
  }, [profiles]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Verification <span className="gradient-text">History</span></h1>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">Browse previously verified profiles stored in MongoDB.</p>
          </div>

          {/* Globally Analyzed Profile Section */}
          {mostAnalyzedProfile && mostAnalyzedProfile.analyzedBy && mostAnalyzedProfile.analyzedBy.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border-brand-500/30 bg-brand-900/10 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FiTrendingUp className="text-8xl text-brand-400" />
              </div>
              <div className="relative z-10">
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><FiTrendingUp className="text-brand-400" /> Most Globally Analyzed Profile</h2>
                <p className="text-xs text-slate-400 mb-4">This profile has been verified by the highest number of users.</p>
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface-800/50 p-4 rounded-xl border border-brand-500/10">
                  {mostAnalyzedProfile.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mostAnalyzedProfile.imageUrl} alt={mostAnalyzedProfile.username} className="w-16 h-16 rounded-xl object-cover border-2 border-brand-500/30" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-600/30 to-cyber-purple/30 flex items-center justify-center text-white text-xl font-bold border border-brand-500/20">
                      {mostAnalyzedProfile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-lg font-bold text-white">@{mostAnalyzedProfile.username}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${badge[mostAnalyzedProfile.result].bg} ${badge[mostAnalyzedProfile.result].color} border ${badge[mostAnalyzedProfile.result].border}`}>
                        {mostAnalyzedProfile.result}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <FiUsers /> Analyzed by {mostAnalyzedProfile.analyzedBy.length} user{mostAnalyzedProfile.analyzedBy.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          {userRole !== "admin" && (
            <div className="flex justify-center mb-6">
              <div className="bg-surface-800/60 p-1 rounded-xl flex items-center gap-1 border border-brand-500/20">
                <button
                  onClick={() => setActiveTab("my")}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "my" ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  My History
                </button>
                <button
                  onClick={() => setActiveTab("global")}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "global" ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  Global History
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Search by username…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-surface-800/60 border border-brand-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400 transition-all" />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchAll} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-300 text-sm font-medium hover:bg-brand-600/30 transition-colors cursor-pointer">
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </motion.button>
          </div>

          {/* Count */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FiDatabase /> {filtered.length} profile{filtered.length !== 1 ? "s" : ""} found
          </div>

          {/* Grid */}
          {loading ? (
            <div className="text-center py-20"><FiRefreshCw className="mx-auto text-3xl text-brand-400 animate-spin mb-3" /><p className="text-slate-500 text-sm">Loading from MongoDB…</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 glass-card"><p className="text-slate-500 text-sm">No profiles found in this history.</p></div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filtered.map((p) => {
                  const b = badge[p.result]; const B = b.icon; const isOpen = expanded === p.id;
                  return (
                    <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={() => setExpanded(isOpen ? null : p.id)} className="glass-card glass-card-hover p-5 cursor-pointer transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt={p.username} className="w-10 h-10 rounded-xl object-cover border-2 border-brand-500/20" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600/30 to-cyber-purple/30 flex items-center justify-center text-white text-sm font-bold border border-brand-500/20">
                              {p.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="text-white font-semibold text-sm">@{p.username}</span>
                            <span className="block text-[10px] text-brand-300 flex items-center gap-1 mt-0.5">
                              {p.platform ? platformIcons[p.platform] : <FiList className="inline" />} {p.platform || "Unknown"}
                            </span>
                            {p.imageUrl && <span className="block text-[10px] text-blue-400 flex items-center gap-1 mt-0.5"><FiImage className="inline" /> Profile Picture</span>}
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${b.bg} ${b.color} border ${b.border}`}>{p.result}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                        <span className="flex items-center gap-1"><FiUsers /> {p.followers}</span>
                        <span className="flex items-center gap-1"><FiFileText /> {p.posts}</span>
                        <span className="flex items-center gap-1"><FiClock /> {p.accountAge}</span>
                      </div>

                      {/* Risk bar */}
                      <div className="h-1.5 rounded-full bg-surface-700 overflow-hidden mb-2">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${p.riskScore}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: p.riskScore <= 30 ? "#10b981" : p.riskScore <= 60 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <p className="text-xs text-slate-500 flex justify-between">
                        <span>Risk: <strong className={b.color}>{Math.round(p.riskScore)}%</strong></span>
                        {activeTab === "global" && p.analyzedBy && (
                          <span className="text-brand-300 flex items-center gap-1"><FiUsers className="inline" /> {p.analyzedBy.length}</span>
                        )}
                      </p>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 pt-3 border-t border-brand-500/10 space-y-2">
                            <div className="text-xs text-slate-400"><FiHash className="inline mr-1" /> <span className="font-mono text-brand-300">{p.dataHash?.slice(0, 40)}…</span></div>
                            <div className="text-xs text-slate-400"><FiLink className="inline mr-1" /> <span className="font-mono text-cyber-green">{p.blockchainTx?.slice(0, 40)}…</span></div>
                            {p.imageUrl && <div className="text-xs text-slate-400"><FiImage className="inline mr-1" /> <span className="font-mono text-blue-300 break-all">{p.imageUrl}</span></div>}
                            {p.bio && <div className="text-xs text-slate-400 italic">&ldquo;{p.bio}&rdquo;</div>}
                            <div className="text-[10px] text-slate-600">{new Date(p.createdAt).toLocaleString()}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
