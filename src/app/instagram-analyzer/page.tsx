"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiInstagram,
  FiFacebook,
  FiTwitter,
  FiLinkedin,
  FiSearch,
  FiX,
  FiUsers,
  FiUserPlus,
  FiImage,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiLink,
  FiHash,
  FiClock,
  FiFileText,
  FiExternalLink,
  FiLoader,
  FiInfo,
} from "react-icons/fi";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ---------- Types ----------

interface ProfileData {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  verified: boolean;
  profilePicUrl: string;
  isPrivate: boolean;
  externalUrl: string;
}

interface AnalysisResult {
  riskScore: number;
  fakeProbability: number;
  verdict: "REAL" | "SUSPICIOUS" | "HIGHLY FAKE";
  reasons: { signal: string; detail: string; weight: number }[];
}

interface BlockchainProof {
  txHash: string;
  dataHash: string;
  timestamp: string;
}

interface ApiResponse {
  success: boolean;
  profile?: ProfileData;
  analysis?: AnalysisResult;
  blockchainProof?: BlockchainProof | null;
  error?: string;
}

// ---------- Helpers ----------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function getVerdictConfig(verdict: string) {
  switch (verdict) {
    case "REAL":
      return {
        color: "text-cyber-green",
        bg: "bg-cyber-green/10",
        border: "border-cyber-green/30",
        glow: "shadow-cyber-green/20",
        icon: FiCheckCircle,
        label: "Likely Real",
      };
    case "SUSPICIOUS":
      return {
        color: "text-cyber-amber",
        bg: "bg-cyber-amber/10",
        border: "border-cyber-amber/30",
        glow: "shadow-cyber-amber/20",
        icon: FiAlertTriangle,
        label: "Suspicious",
      };
    default:
      return {
        color: "text-cyber-red",
        bg: "bg-cyber-red/10",
        border: "border-cyber-red/30",
        glow: "shadow-cyber-red/20",
        icon: FiXCircle,
        label: "Highly Fake",
      };
  }
}

function getRiskGaugeColor(score: number): string {
  if (score <= 25) return "#10b981";
  if (score <= 55) return "#f59e0b";
  return "#ef4444";
}

// ---------- Component ----------

export default function InstagramAnalyzerPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedUsername, setDetectedUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("instagram");

  // Auto-detect username from input
  const handleInputChange = (val: string) => {
    setInput(val);
    setError(null);

    // Try to extract username for preview
    const urlMatch = val.match(
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?/i
    );
    if (urlMatch) {
      setDetectedUsername(urlMatch[1].toLowerCase());
    } else if (val.startsWith("@")) {
      setDetectedUsername(val.slice(1).toLowerCase());
    } else if (/^[a-zA-Z0-9._]{1,30}$/.test(val.trim())) {
      setDetectedUsername(val.trim().toLowerCase());
    } else {
      setDetectedUsername(null);
    }
  };

  const handleClear = () => {
    setInput("");
    setResult(null);
    setError(null);
    setDetectedUsername(null);
  };

  const handleAnalyze = useCallback(async () => {
    if (!input.trim()) {
      setError("Please enter an Instagram URL or username.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/instagram/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });

      const data: ApiResponse = await res.json();

      if (!data.success) {
        setError(data.error || "Analysis failed.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [input]);

  const verdictConfig = result?.analysis
    ? getVerdictConfig(result.analysis.verdict)
    : null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        {/* Background orbs */}
        <div className="fixed top-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-cyber-pink/8 blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-150px] right-[-80px] w-[400px] h-[400px] rounded-full bg-brand-600/8 blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          {/* ---- Header ---- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full border border-cyber-pink/30 bg-cyber-pink/10 text-cyber-pink text-xs font-semibold tracking-wider uppercase">
              {/* <FiInstagram className="text-sm" /> */}
              Profile Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              Social Media{" "}
              <span className="gradient-text">Profile Analyzer</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Paste an social media profile URL or username. Our AI engine scrapes
              public data via Apify, runs 9+ risk signals, and delivers a
              real-time fake probability score with blockchain proof.
            </p>
          </motion.div>

          {/* ---- Tabs ---- */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {[
              { id: "instagram", label: "Instagram", icon: FiInstagram },
              { id: "facebook", label: "Facebook", icon: FiFacebook },
              { id: "twitter", label: "Twitter", icon: FiTwitter },
              { id: "linkedin", label: "LinkedIn", icon: FiLinkedin },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    handleClear();
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                    isActive
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                      : "bg-surface-800 text-slate-400 hover:text-white hover:bg-surface-700 border border-surface-600"
                  }`}
                >
                  <Icon className={isActive ? "text-white" : "text-brand-400"} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ---- Disclaimer ---- */}
          <div className="glass-card p-4 border-cyber-amber/30 bg-cyber-amber/5 flex items-start gap-3 max-w-3xl mx-auto mb-8">
            <FiAlertTriangle className="text-cyber-amber text-lg flex-shrink-0 mt-0.5" />
            <p className="text-slate-300 text-sm leading-relaxed">
              <strong>Disclaimer:</strong> This website may not be completely accurate and could contain errors. Its analysis is based on heuristics and publicly available data, so please use the results as a guideline rather than an absolute truth.
            </p>
          </div>

          {activeTab === "instagram" ? (
            /* ---- Input Section ---- */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 sm:p-8"
            >
              <label
                htmlFor="instagram-input"
                className="block text-sm font-medium text-slate-300 mb-3"
              >
                Enter Instagram Profile URL or Username
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <FiInstagram className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400 text-lg" />
                  <input
                    id="instagram-input"
                    type="text"
                    placeholder="https://instagram.com/username  or  @username"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-800 border border-brand-500/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/60 focus:ring-1 focus:ring-brand-400/30 transition-all text-sm disabled:opacity-50"
                  />
                  {detectedUsername && !loading && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-300 font-mono bg-brand-500/10 px-2 py-0.5 rounded">
                      @{detectedUsername}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAnalyze}
                    disabled={loading || !input.trim()}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyber-pink to-brand-600 text-white font-semibold text-sm shadow-lg shadow-cyber-pink/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {loading ? (
                      <FiLoader className="animate-spin" />
                    ) : (
                      <FiSearch />
                    )}
                    {loading ? "Analyzing…" : "Analyze"}
                  </motion.button>
                  {(input || result) && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleClear}
                      className="flex items-center gap-1 px-4 py-3.5 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-sm cursor-pointer"
                    >
                      <FiX />
                      Clear
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm flex items-center gap-2"
                  >
                    <FiAlertTriangle />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* ---- Waiting to be built ---- */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-12 text-center"
            >
              <div className="w-16 h-16 mx-auto bg-surface-800 border border-surface-600 rounded-full flex items-center justify-center mb-4">
                <FiInfo className="text-2xl text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Under Development</h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                The analyzer for {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} is currently under development. Check back soon!
              </p>
            </motion.div>
          )}

          {/* ---- Loading State ---- */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-10 text-center"
              >
                <div className="relative mx-auto w-20 h-20 mb-6">
                  {/* Spinning ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-cyber-pink border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-brand-400 border-b-transparent border-l-transparent animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                  <FiInstagram className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyber-pink text-2xl" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  Scanning Profile…
                </h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Fetching public Instagram data via Apify, running risk analysis
                  across 9+ signals, and preparing your report.
                </p>
                {/* Animated dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-brand-400"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---- Results ---- */}
          <AnimatePresence>
            {result?.success && result.profile && result.analysis && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* ---- Profile Card ---- */}
                <div className="glass-card p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0 flex justify-center sm:justify-start">
                      <div className="relative">
                        <div className={`w-24 h-24 rounded-full overflow-hidden border-2 ${verdictConfig?.border} ${verdictConfig?.glow} shadow-lg`}>
                          {result.profile.profilePicUrl ? (
                            <img
                              src={`/api/instagram/proxy-image?url=${encodeURIComponent(result.profile.profilePicUrl)}`}
                              alt={result.profile.username}
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback: hide broken image and show icon
                                const target = e.currentTarget;
                                target.style.display = "none";
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-full bg-surface-700 items-center justify-center"
                            style={{ display: result.profile.profilePicUrl ? "none" : "flex" }}
                          >
                            <FiUsers className="text-3xl text-slate-500" />
                          </div>
                        </div>
                        {result.profile.verified && (
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-cyber-blue flex items-center justify-center border-2 border-surface-900">
                            <FiCheckCircle className="text-white text-xs" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <h2 className="text-xl font-bold text-white">
                          {result.profile.fullName || result.profile.username}
                        </h2>
                        {result.profile.verified && (
                          <span className="px-2 py-0.5 rounded text-xs bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30 font-medium">
                            Verified
                          </span>
                        )}
                        {result.profile.isPrivate && (
                          <span className="px-2 py-0.5 rounded text-xs bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/30 font-medium">
                            Private
                          </span>
                        )}
                      </div>
                      <p className="text-brand-300 text-sm font-mono mb-3">
                        @{result.profile.username}
                      </p>
                      {result.profile.biography && (
                        <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-lg">
                          {result.profile.biography}
                        </p>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center justify-center sm:justify-start gap-6">
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">
                            {formatNumber(result.profile.postsCount)}
                          </div>
                          <div className="text-slate-500 text-xs uppercase tracking-wider">
                            Posts
                          </div>
                        </div>
                        <div className="w-px h-8 bg-brand-500/20" />
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">
                            {formatNumber(result.profile.followersCount)}
                          </div>
                          <div className="text-slate-500 text-xs uppercase tracking-wider">
                            Followers
                          </div>
                        </div>
                        <div className="w-px h-8 bg-brand-500/20" />
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">
                            {formatNumber(result.profile.followsCount)}
                          </div>
                          <div className="text-slate-500 text-xs uppercase tracking-wider">
                            Following
                          </div>
                        </div>
                      </div>

                      {result.profile.externalUrl && (
                        <a
                          href={result.profile.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-3 text-xs text-brand-300 hover:text-white transition-colors"
                        >
                          <FiExternalLink />
                          {result.profile.externalUrl}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* ---- Risk Score + Verdict Row ---- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Risk Score Gauge */}
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="glass-card p-6 flex flex-col items-center justify-center"
                  >
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                      Risk Score
                    </div>
                    <div className="relative w-28 h-28">
                      <svg
                        viewBox="0 0 120 120"
                        className="w-full h-full -rotate-90"
                      >
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="rgba(30,30,60,0.5)"
                          strokeWidth="10"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke={getRiskGaugeColor(result.analysis.riskScore)}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${(result.analysis.riskScore / 100) * 314} 314`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className="text-3xl font-bold"
                          style={{
                            color: getRiskGaugeColor(result.analysis.riskScore),
                          }}
                        >
                          {result.analysis.riskScore}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Fake Probability */}
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 flex flex-col items-center justify-center"
                  >
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                      Fake Probability
                    </div>
                    <div
                      className="text-5xl font-extrabold mb-1"
                      style={{
                        color: getRiskGaugeColor(result.analysis.fakeProbability),
                      }}
                    >
                      {result.analysis.fakeProbability}%
                    </div>
                    <div className="w-full mt-2 h-2 rounded-full bg-surface-700 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${result.analysis.fakeProbability}%`,
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: getRiskGaugeColor(
                            result.analysis.fakeProbability
                          ),
                        }}
                      />
                    </div>
                  </motion.div>

                  {/* Verdict Badge */}
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`glass-card p-6 flex flex-col items-center justify-center border ${verdictConfig?.border}`}
                  >
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                      Verdict
                    </div>
                    <div
                      className={`w-16 h-16 rounded-full ${verdictConfig?.bg} flex items-center justify-center mb-3 ${verdictConfig?.glow} shadow-lg`}
                    >
                      {verdictConfig &&
                        (() => {
                          const Icon = verdictConfig.icon;
                          return (
                            <Icon
                              className={`text-3xl ${verdictConfig.color}`}
                            />
                          );
                        })()}
                    </div>
                    <div
                      className={`text-lg font-bold ${verdictConfig?.color}`}
                    >
                      {verdictConfig?.label}
                    </div>
                  </motion.div>
                </div>

                {/* ---- Risk Reasons ---- */}
                {result.analysis.reasons.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6"
                  >
                    <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <FiFileText className="text-brand-400" />
                      Risk Analysis Breakdown
                    </h3>
                    <div className="space-y-3">
                      {result.analysis.reasons.map((reason, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + i * 0.05 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/60 border border-brand-500/10"
                        >
                          <div
                            className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              reason.weight > 0
                                ? "bg-cyber-red/10 text-cyber-red"
                                : "bg-cyber-green/10 text-cyber-green"
                            }`}
                          >
                            {reason.weight > 0 ? (
                              <FiAlertTriangle className="text-sm" />
                            ) : (
                              <FiCheckCircle className="text-sm" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-medium">
                                {reason.signal}
                              </span>
                              <span
                                className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                                  reason.weight > 0
                                    ? "bg-cyber-red/10 text-cyber-red"
                                    : "bg-cyber-green/10 text-cyber-green"
                                }`}
                              >
                                {reason.weight > 0 ? "+" : ""}
                                {reason.weight}
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                              {reason.detail}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ---- Blockchain Proof ---- */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-card p-6"
                >
                  <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                    <FiLink className="text-brand-400" />
                    Blockchain Verification Proof
                  </h3>
                  {result.blockchainProof ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/60 border border-cyber-green/10">
                        <FiHash className="text-cyber-green mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500 mb-0.5">
                            Verification Hash
                          </div>
                          <div className="text-sm text-white font-mono break-all">
                            {result.blockchainProof.dataHash}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/60 border border-brand-500/10">
                        <FiLink className="text-brand-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500 mb-0.5">
                            Transaction Hash
                          </div>
                          <div className="text-sm text-brand-300 font-mono break-all">
                            {result.blockchainProof.txHash}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/60 border border-brand-500/10">
                        <FiClock className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-slate-500 mb-0.5">
                            Timestamp
                          </div>
                          <div className="text-sm text-white">
                            {new Date(
                              result.blockchainProof.timestamp
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-surface-800/40 border border-brand-500/10 text-center">
                      <FiInfo className="mx-auto text-2xl text-slate-500 mb-2" />
                      <p className="text-slate-400 text-sm">
                        Blockchain proof was not generated for this scan.
                        This may be due to network configuration or wallet balance.
                      </p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
}
