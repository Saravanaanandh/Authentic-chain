"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileReport, { ProfileReportData } from "@/components/ProfileReport";
import {
  FiRefreshCw,
  FiSearch,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiClock,
  FiDatabase,
  FiArrowLeft,
  FiLoader,
} from "react-icons/fi";

interface ProfileItem {
  id: string;
  username: string;
  followers: number;
  posts: number;
  accountAge: string;
  bio: string;
  imageUrl: string;
  dataHash: string;
  riskScore: number;
  result: "REAL" | "SUSPICIOUS" | "FAKE" | "ANALYZING";
  blockchainTx: string;
  createdAt: string;
  platform?: string;
  fullDoc?: any;
  hasSubmittedFeedback?: boolean;
}

const badgeConfig: Record<string, any> = {
  REAL: { icon: FiCheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10", border: "border-green-200 dark:border-green-500/30", label: "REAL" },
  SUSPICIOUS: { icon: FiAlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/30", label: "SUSPICIOUS" },
  FAKE: { icon: FiXCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/30", label: "FAKE" },
  ANALYZING: { icon: FiRefreshCw, color: "text-blue-500 animate-spin", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/30", label: "ANALYZING..." },
};

function getRiskColor(score: number): string {
  if (score <= 30) return "#22c55e";
  if (score <= 60) return "#f59e0b";
  return "#ef4444";
}

export default function HistoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileItem | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchMyHistory = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/profiles/my");
      const d = await r.json();
      setProfiles(d.profiles || []);
    } catch {
      /* empty */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMyHistory();
    }
  }, [fetchMyHistory, status]);

  const filtered = profiles.filter((p) =>
    p.username.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  // ---- Detail View when a profile is selected ----
  if (selectedProfile) {
    const reportData: ProfileReportData = selectedProfile.fullDoc
      ? {
          success: true,
          username: selectedProfile.username,
          apifyData: {
            username: selectedProfile.username,
            ...(selectedProfile.fullDoc.profileData || {}),
          },
          hybridAnalysis: selectedProfile.fullDoc.hybridAnalysis || {
            finalRiskScore: selectedProfile.riskScore,
            finalFakeProbability: selectedProfile.riskScore,
            finalVerdict: selectedProfile.result === "FAKE" ? "HIGHLY FAKE" : selectedProfile.result,
            combinedReasons: selectedProfile.fullDoc.analysis?.reasons || [],
            weights: { external: 0, internal: 100 },
          },
          internalAnalysis: selectedProfile.fullDoc.internalAnalysis,
          externalAnalysis: selectedProfile.fullDoc.externalAnalysis,
          blockchainProof: selectedProfile.fullDoc.blockchainTx
            ? {
                txHash: selectedProfile.fullDoc.blockchainTx,
                dataHash: selectedProfile.fullDoc.blockchainHash || "",
                timestamp: selectedProfile.createdAt,
              }
            : null,
          hasSubmittedFeedback: selectedProfile.hasSubmittedFeedback,
        }
      : {
          success: true,
          apifyData: {
            username: selectedProfile.username,
            fullName: selectedProfile.username,
            biography: selectedProfile.bio,
            followersCount: selectedProfile.followers,
            followsCount: 0,
            postsCount: selectedProfile.posts,
            verified: false,
            profilePicUrl: selectedProfile.imageUrl,
            isPrivate: false,
            externalUrl: "",
          },
          hybridAnalysis: {
            finalRiskScore: selectedProfile.riskScore,
            finalFakeProbability: selectedProfile.riskScore,
            finalVerdict: selectedProfile.result === "FAKE" ? "HIGHLY FAKE" : selectedProfile.result,
            combinedReasons: [],
            weights: { external: 0, internal: 100 },
          },
          hasSubmittedFeedback: selectedProfile.hasSubmittedFeedback,
        };

    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-16 px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            <button
              onClick={() => setSelectedProfile(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 text-sm font-medium text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer mb-2"
            >
              <FiArrowLeft /> Back to History
            </button>

            {/* Render complete profile report WITHOUT search bar */}
            <ProfileReport data={reportData} showSearchBar={false} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-2">
              My History
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Your previously analyzed profiles
            </p>
          </div>

          {/* Search & Refresh */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-black dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500 transition-all"
              />
            </div>
            <button
              onClick={fetchMyHistory}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 text-sm hover:text-black dark:hover:text-white hover:border-gray-400 dark:hover:border-neutral-500 transition-colors cursor-pointer"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {/* Count */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <FiDatabase /> {filtered.length} profile{filtered.length !== 1 ? "s" : ""} found
          </div>

          {/* Grid */}
          {loading ? (
            <div className="text-center py-20">
              <FiRefreshCw className="mx-auto text-3xl text-gray-400 animate-spin mb-3" />
              <p className="text-gray-400 text-sm">Loading your history…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 glass-card">
              <p className="text-gray-400 text-sm">No profiles found. Start analyzing from the home page!</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filtered.map((p) => {
                  const b = badgeConfig[p.result] || badgeConfig.SUSPICIOUS;
                  const BIcon = b.icon;
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedProfile(p)}
                      className="glass-card p-5 transition-all cursor-pointer hover:border-gray-400 dark:hover:border-neutral-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.imageUrl}
                              alt={p.username}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-neutral-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-black dark:text-white text-sm font-bold">
                              {p.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="text-black dark:text-white font-medium text-sm">
                              @{p.username}
                            </span>
                            <span className="block text-xs text-gray-400 mt-0.5">
                              {p.platform || "Instagram"}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${b.bg} ${b.color} border ${b.border} flex items-center gap-1`}
                        >
                          <BIcon className="text-xs" />
                          {b.label}
                        </span>
                      </div>

                      {/* Risk bar */}
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p.riskScore}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{ background: getRiskColor(p.riskScore) }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 flex justify-between">
                        <span>
                          Risk: <strong className={b.color}>{Math.round(p.riskScore)}%</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="text-[10px]" />
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </p>
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
