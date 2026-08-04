"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FiRefreshCw, FiXCircle, FiClock, FiAlertTriangle, FiLock } from "react-icons/fi";

interface FakeProfile {
  id: string;
  username: string;
  imageUrl: string;
  riskScore: number;
  verdict: string;
  detectionDate: string;
  platform: string;
}

function getRiskColor(score: number): string {
  if (score <= 30) return "#22c55e";
  if (score <= 60) return "#f59e0b";
  return "#ef4444";
}

export default function GlobalFakesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profiles, setProfiles] = useState<FakeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "admin")) {
      setAccessDenied(true);
      setLoading(false);
    }
  }, [status, session]);

  const fetchFakes = useCallback(async () => {
    if (session?.user?.role !== "admin") return;
    setLoading(true);
    try {
      const r = await fetch("/api/profiles/global-fakes");
      if (!r.ok) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const d = await r.json();
      setProfiles(d.profiles || []);
    } catch { /* empty */ }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchFakes();
    }
  }, [fetchFakes, session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (accessDenied || session?.user?.role !== "admin") {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center">
          <div className="glass-card p-10 text-center max-w-md mx-auto border-gray-200 dark:border-neutral-800">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <FiLock className="text-2xl text-black dark:text-white" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white mb-2">Access Restricted</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Global fake profile records are restricted for data security and privacy compliance.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Back to Home
            </button>
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
          {/* Header */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-500 text-xs font-medium">
              <FiAlertTriangle className="text-xs" />
              Admin Security Panel
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-2">
              Global Fake Profiles
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
              Profiles detected as FAKE by our AI engine. Usernames are blurred for privacy.
            </p>
          </div>

          {/* Refresh */}
          <div className="flex justify-end">
            <button
              onClick={fetchFakes}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 text-sm hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="text-center py-20">
              <FiRefreshCw className="mx-auto text-3xl text-gray-400 animate-spin mb-3" />
              <p className="text-gray-400 text-sm">Loading fake profiles…</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-20 glass-card">
              <FiXCircle className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-400 text-sm">No fake profiles detected yet.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {profiles.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card p-5 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-neutral-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 text-lg font-bold">
                          ?
                        </div>
                      )}
                      <div>
                        <p className="text-black dark:text-white font-medium text-sm font-mono">
                          {p.username}
                        </p>
                        <p className="text-xs text-gray-400">{p.platform}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Risk Score</span>
                        <span className="font-bold" style={{ color: getRiskColor(p.riskScore) }}>
                          {Math.round(p.riskScore)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p.riskScore}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{ background: getRiskColor(p.riskScore) }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-200 dark:border-red-500/30">
                        FAKE
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <FiClock />
                        {new Date(p.detectionDate).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
