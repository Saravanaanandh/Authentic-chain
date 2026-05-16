"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FiRefreshCw, FiSearch, FiCheckCircle, FiAlertTriangle, FiXCircle, FiHash, FiLink, FiUsers, FiFileText, FiClock, FiDatabase, FiImage, FiTrendingUp, FiInstagram, FiList, FiEdit2, FiTrash2, FiSave, FiX } from "react-icons/fi";

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

  // Admin edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVerdict, setEditVerdict] = useState<string>("");
  const [editScore, setEditScore] = useState<number>(0);
  const [isActionLoading, setIsActionLoading] = useState(false);

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

  const handleDelete = async (username: string) => {
    if (!confirm("Are you sure you want to permanently delete this profile from history?")) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(username)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setProfiles(p => p.filter(x => x.username !== username));
    } catch (e) {
      console.error(e);
      alert("Failed to delete");
    }
    setIsActionLoading(false);
  };

  const startEdit = (p: Profile, e: React.MouseEvent) => {
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
        setProfiles(p => p.map(x => {
          if (x.username === username) {
            return { ...x, result: editVerdict === "HIGHLY FAKE" ? "FAKE" : editVerdict as "REAL"|"SUSPICIOUS"|"FAKE", riskScore: editScore };
          }
          return x;
        }));
        setEditingId(null);
      } else {
        alert("Failed to update");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    }
    setIsActionLoading(false);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white mb-2">Verification <span className="gradient-text">History</span></h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-lg mx-auto">Browse previously verified profiles stored in MongoDB.</p>
          </div>

          {/* Globally Analyzed Profile Section */}
          {mostAnalyzedProfile && mostAnalyzedProfile.analyzedBy && mostAnalyzedProfile.analyzedBy.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border-gray-300 dark:border-zinc-800 bg-brand-900/10 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FiTrendingUp className="text-8xl text-brand-700 dark:text-brand-400" />
              </div>
              <div className="relative z-10">
                <h2 className="text-lg font-bold text-black dark:text-white mb-1 flex items-center gap-2"><FiTrendingUp className="text-brand-700 dark:text-brand-400" /> Most Globally Analyzed Profile</h2>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-4">This profile has been verified by the highest number of users.</p>
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-100 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-300 dark:border-zinc-800">
                  {mostAnalyzedProfile.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mostAnalyzedProfile.imageUrl} alt={mostAnalyzedProfile.username} className="w-16 h-16 rounded-xl object-cover border-2 border-gray-300 dark:border-zinc-800" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-600/30 to-cyber-purple/30 flex items-center justify-center text-white text-xl font-bold border border-gray-300 dark:border-zinc-800">
                      {mostAnalyzedProfile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-lg font-bold text-black dark:text-white">@{mostAnalyzedProfile.username}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${badge[mostAnalyzedProfile.result].bg} ${badge[mostAnalyzedProfile.result].color} border ${badge[mostAnalyzedProfile.result].border}`}>
                        {mostAnalyzedProfile.result}
                      </span>
                      <span className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
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
              <div className="bg-gray-100 dark:bg-zinc-900/60 p-1 rounded-xl flex items-center gap-1 border border-gray-300 dark:border-zinc-800">
                <button
                  onClick={() => setActiveTab("my")}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "my" ? "bg-brand-600 text-white shadow-lg" : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"}`}
                >
                  My History
                </button>
                <button
                  onClick={() => setActiveTab("global")}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "global" ? "bg-brand-600 text-white shadow-lg" : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"}`}
                >
                  Global History
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <input type="text" placeholder="Search by username…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-gray-100 dark:bg-zinc-900/60 border border-gray-300 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-black dark:text-white placeholder:text-gray-500 dark:text-gray-400 focus:outline-none focus:border-brand-400 transition-all" />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchAll} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600/20 border border-gray-300 dark:border-zinc-800 text-brand-700 dark:text-brand-300 text-sm font-medium hover:bg-brand-600/30 transition-colors cursor-pointer">
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </motion.button>
          </div>

          {/* Count */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <FiDatabase /> {filtered.length} profile{filtered.length !== 1 ? "s" : ""} found
          </div>

          {/* Grid */}
          {loading ? (
            <div className="text-center py-20"><FiRefreshCw className="mx-auto text-3xl text-brand-700 dark:text-brand-400 animate-spin mb-3" /><p className="text-gray-500 dark:text-gray-400 text-sm">Loading from MongoDB…</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 glass-card"><p className="text-gray-500 dark:text-gray-400 text-sm">No profiles found in this history.</p></div>
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
                            <img src={p.imageUrl} alt={p.username} className="w-10 h-10 rounded-xl object-cover border-2 border-gray-300 dark:border-zinc-800" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600/30 to-cyber-purple/30 flex items-center justify-center text-white text-sm font-bold border border-gray-300 dark:border-zinc-800">
                              {p.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="text-black dark:text-white font-semibold text-sm">@{p.username}</span>
                            <span className="block text-[10px] text-brand-700 dark:text-brand-300 flex items-center gap-1 mt-0.5">
                              {p.platform ? platformIcons[p.platform] : <FiList className="inline" />} {p.platform || "Unknown"}
                            </span>
                            {p.imageUrl && <span className="block text-[10px] text-blue-400 flex items-center gap-1 mt-0.5"><FiImage className="inline" /> Profile Picture</span>}
                          </div>
                        </div>
                        {editingId === p.username ? (
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <select 
                              value={editVerdict} 
                              onChange={e => setEditVerdict(e.target.value)}
                              className="bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs rounded px-2 py-1 text-black dark:text-white"
                            >
                              <option value="REAL">REAL</option>
                              <option value="SUSPICIOUS">SUSPICIOUS</option>
                              <option value="HIGHLY FAKE">FAKE</option>
                            </select>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${b.bg} ${b.color} border ${b.border}`}>{p.result}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-700 dark:text-gray-300 mb-2">
                        <span className="flex items-center gap-1"><FiUsers /> {p.followers}</span>
                        <span className="flex items-center gap-1"><FiFileText /> {p.posts}</span>
                        <span className="flex items-center gap-1"><FiClock /> {p.accountAge}</span>
                      </div>

                      {/* Risk bar */}
                      {editingId === p.username ? (
                        <div className="mb-2" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Adjust Risk Score:</span>
                            <strong>{editScore}%</strong>
                          </div>
                          <input 
                            type="range" min="0" max="100" 
                            value={editScore} 
                            onChange={e => setEditScore(Number(e.target.value))}
                            className="w-full accent-brand-500"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden mb-2">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${p.riskScore}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: p.riskScore <= 30 ? "#10b981" : p.riskScore <= 60 ? "#f59e0b" : "#ef4444" }} />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                            <span>Risk: <strong className={b.color}>{Math.round(p.riskScore)}%</strong></span>
                            {activeTab === "global" && p.analyzedBy && (
                              <span className="text-brand-700 dark:text-brand-300 flex items-center gap-1"><FiUsers className="inline" /> {p.analyzedBy.length}</span>
                            )}
                          </p>
                        </>
                      )}

                      {/* Admin Controls */}
                      {userRole === "admin" && (
                        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-300 dark:border-zinc-800">
                          {editingId === p.username ? (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1.5 rounded bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors" title="Cancel">
                                <FiX size={14} />
                              </button>
                              <button disabled={isActionLoading} onClick={(e) => handleSaveEdit(p.username, e)} className="p-1.5 rounded bg-brand-600/20 text-brand-700 dark:text-brand-300 hover:bg-brand-600 hover:text-white transition-colors" title="Save">
                                <FiSave size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={(e) => startEdit(p, e)} className="p-1.5 rounded bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors" title="Edit Profile Data">
                                <FiEdit2 size={14} />
                              </button>
                              <button disabled={isActionLoading} onClick={(e) => { e.stopPropagation(); handleDelete(p.username); }} className="p-1.5 rounded bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-cyber-red/10 hover:text-cyber-red hover:border-cyber-red/30 transition-colors" title="Delete Profile">
                                <FiTrash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 pt-3 border-t border-gray-300 dark:border-zinc-800 space-y-2">
                            <div className="text-xs text-gray-700 dark:text-gray-300"><FiHash className="inline mr-1" /> <span className="font-mono text-brand-700 dark:text-brand-300">{p.dataHash?.slice(0, 40)}…</span></div>
                            <div className="text-xs text-gray-700 dark:text-gray-300"><FiLink className="inline mr-1" /> <span className="font-mono text-cyber-green">{p.blockchainTx?.slice(0, 40)}…</span></div>
                            {p.imageUrl && <div className="text-xs text-gray-700 dark:text-gray-300"><FiImage className="inline mr-1" /> <span className="font-mono text-blue-300 break-all">{p.imageUrl}</span></div>}
                            {p.bio && <div className="text-xs text-gray-700 dark:text-gray-300 italic">&ldquo;{p.bio}&rdquo;</div>}
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
