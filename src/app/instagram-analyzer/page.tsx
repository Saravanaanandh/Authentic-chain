"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  FiCpu,
} from "react-icons/fi";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileNotFound from "@/components/ProfileNotFound";
import FeedbackForm from "@/components/FeedbackForm";


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
  tabularScore?: number;
  imageScore?: number;
  bioScore?: number;
  anomalyScore?: number;
}

interface BlockchainProof {
  txHash: string;
  dataHash: string;
  timestamp: string;
}

interface ApiResponse {
  success: boolean;
  username?: string;
  apifyData?: ProfileData;
  internalAnalysis?: any;
  externalAnalysis?: any;
  hybridAnalysis?: {
    finalFakeProbability: number;
    finalRiskScore: number;
    finalVerdict: string;
    combinedReasons: { signal: string; detail: string; weight: number }[];
    weights: { external: number; internal: number };
    externalUnavailable?: boolean;
    aiExplanation?: string;
    aiRiskLevel?: string;
    aiSuggestions?: string[];
  };
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
        color: "text-green-500",
        bg: "bg-green-50 dark:bg-green-500/10",
        border: "border-green-200 dark:border-green-500/30",
        glow: "",
        icon: FiCheckCircle,
        label: "Likely Real",
      };
    case "SUSPICIOUS":
      return {
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        border: "border-amber-200 dark:border-amber-500/30",
        glow: "",
        icon: FiAlertTriangle,
        label: "Suspicious",
      };
    default:
      return {
        color: "text-red-500",
        bg: "bg-red-50 dark:bg-red-500/10",
        border: "border-red-200 dark:border-red-500/30",
        glow: "",
        icon: FiXCircle,
        label: "Highly Fake",
      };
  }
}

function getRiskGaugeColor(score: number): string {
  if (score <= 25) return "#22c55e";
  if (score <= 55) return "#f59e0b";
  return "#ef4444";
}

function parseBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-semibold text-black dark:text-white">{part}</strong>;
    }
    return part;
  });
}

function parseMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-2" />;

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.substring(2);
      return (
        <li key={idx} className="ml-4 list-disc text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-1">
          {parseBold(content)}
        </li>
      );
    }

    return (
      <p key={idx} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
        {parseBold(trimmed)}
      </p>
    );
  });
}

// ---------- Inner Component ----------

function AnalyzerContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<{stage: string, username?: string} | null>(null);
  const [detectedUsername, setDetectedUsername] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/");
    }
  }, [status, router]);

  // Auto-start analysis if input was passed via URL
  useEffect(() => {
    const urlInput = searchParams.get("input");
    if (urlInput && status === "authenticated" && !result && !loading) {
      setInput(urlInput);
      handleInputChange(urlInput);
      // Trigger analysis after a short delay
      setTimeout(() => {
        triggerAnalysis(urlInput);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, status]);

  const handleInputChange = (val: string) => {
    setInput(val);
    setError(null);

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
    setValidationError(null);
    setDetectedUsername(null);
    setShowFeedback(false);
  };

  const triggerAnalysis = async (analysisInput: string) => {
    if (!analysisInput.trim()) {
      setError("Please enter an Instagram URL or username.");
      return;
    }

    setLoading(true);
    setError(null);
    setValidationError(null);
    setResult(null);

    try {
      const res = await fetch("/api/instagram/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: analysisInput.trim() }),
      });

      const data: any = await res.json();

      if (!data.success) {
        if (data.stage === "PROFILE_VALIDATION") {
          setValidationError({ stage: data.stage, username: data.username || detectedUsername || "" });
        } else {
          setError(data.error || "Analysis failed.");
        }
      } else {
        setResult(data);
        try {
          const aiRes = await fetch("/api/ai/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prediction: data.hybridAnalysis?.finalVerdict || "UNKNOWN",
              followers: data.apifyData?.followersCount || 0,
              following: data.apifyData?.followsCount || 0,
              posts: data.apifyData?.postsCount || 0,
              bio: data.apifyData?.biography || "",
              hasProfilePic: !!data.apifyData?.profilePicUrl,
              riskScore: data.hybridAnalysis?.finalRiskScore || 0,
              reasons: data.hybridAnalysis?.combinedReasons || [],
            }),
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            setResult((prev) => {
              if (!prev || !prev.hybridAnalysis) return prev;
              return {
                ...prev,
                hybridAnalysis: {
                  ...prev.hybridAnalysis,
                  aiExplanation: aiData.explanation,
                  aiRiskLevel: aiData.riskLevel,
                  aiSuggestions: aiData.suggestions,
                },
              };
            });
          }
        } catch (aiErr) {
          console.error("⚠️ Failed to fetch AI explanation:", aiErr);
        }
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = useCallback(() => {
    triggerAnalysis(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const verdictConfig = result?.hybridAnalysis
    ? getVerdictConfig(result.hybridAnalysis.finalVerdict)
    : null;

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          {/* ---- Header ---- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-2">
              Profile Analyzer
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-lg mx-auto">
              Paste an Instagram profile URL or username. Our AI engine analyzes
              public data and delivers a real-time fake probability score.
            </p>
          </motion.div>

          {/* ---- Input Section ---- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 sm:p-8"
          >
            <label
              htmlFor="instagram-input"
              className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-3"
            >
              Enter Instagram Profile URL or Username
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  id="instagram-input"
                  type="text"
                  placeholder="https://instagram.com/username  or  @username"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-black dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500 transition-all text-sm disabled:opacity-50"
                />
                {detectedUsername && !loading && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                    @{detectedUsername}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !input.trim()}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {loading ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiSearch />
                  )}
                  {loading ? "Analyzing…" : "Analyze"}
                </button>
                {(input || result) && (
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1 px-4 py-3.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-500 hover:text-black dark:hover:text-white transition-colors text-sm cursor-pointer"
                  >
                    <FiX />
                    Clear
                  </button>
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
                  className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-500 text-sm flex items-center gap-2"
                >
                  <FiAlertTriangle />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ---- Loading State ---- */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-10 text-center"
              >
                <div className="relative mx-auto w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-neutral-700" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-black dark:border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                </div>
                <h3 className="text-black dark:text-white font-semibold text-lg mb-2">
                  Scanning Profile…
                </h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  Fetching public data, running AI analysis, and preparing your report.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---- Profile Validation Error ---- */}
          <AnimatePresence>
            {validationError && (
              <ProfileNotFound 
                username={validationError.username} 
                onRetry={handleClear} 
              />
            )}
          </AnimatePresence>

          {/* ---- Results ---- */}
          <AnimatePresence>
            {result?.success && result.apifyData && result.hybridAnalysis && (
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
                        <div className={`w-24 h-24 rounded-full overflow-hidden border-2 ${verdictConfig?.border}`}>
                          {result.apifyData.profilePicUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={result.apifyData.profilePicUrl}
                              alt={result.apifyData.username}
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = "none";
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-full bg-gray-100 dark:bg-neutral-800 items-center justify-center"
                            style={{ display: result.apifyData.profilePicUrl ? "none" : "flex" }}
                          >
                            <FiUsers className="text-3xl text-gray-400" />
                          </div>
                        </div>
                        {result.apifyData.verified && (
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white dark:border-black">
                            <FiCheckCircle className="text-white text-xs" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <h2 className="text-xl font-bold text-black dark:text-white">
                          {result.apifyData.fullName || result.apifyData.username}
                        </h2>
                        {result.apifyData.verified && (
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-500 border border-blue-200 dark:border-blue-500/30 font-medium">
                            Verified
                          </span>
                        )}
                        {result.apifyData.isPrivate && (
                          <span className="px-2 py-0.5 rounded text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-200 dark:border-amber-500/30 font-medium">
                            Private
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm font-mono mb-3">
                        @{result.apifyData.username}
                      </p>
                      {result.apifyData.biography && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4 max-w-lg">
                          {result.apifyData.biography}
                        </p>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center justify-center sm:justify-start gap-6">
                        {[
                          { label: "Posts", value: formatNumber(result.apifyData.postsCount) },
                          { label: "Followers", value: formatNumber(result.apifyData.followersCount) },
                          { label: "Following", value: formatNumber(result.apifyData.followsCount) },
                        ].map((stat) => (
                          <div key={stat.label} className="text-center">
                            <div className="text-black dark:text-white font-bold text-lg">{stat.value}</div>
                            <div className="text-gray-400 text-xs uppercase tracking-wider">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {result.apifyData.externalUrl && (
                        <a
                          href={result.apifyData.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-3 text-xs text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                        >
                          <FiExternalLink />
                          {result.apifyData.externalUrl}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* ---- Risk Score + Verdict Row ---- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Risk Score Gauge */}
                  <div className="glass-card p-6 flex flex-col items-center justify-center">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 text-center">
                      Final Hybrid Risk Score
                    </div>
                    <div className="relative w-28 h-28">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="10" />
                        <circle
                          cx="60" cy="60" r="50" fill="none"
                          stroke={getRiskGaugeColor(result.hybridAnalysis.finalRiskScore)}
                          strokeWidth="10" strokeLinecap="round"
                          strokeDasharray={`${(result.hybridAnalysis.finalRiskScore / 100) * 314} 314`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold" style={{ color: getRiskGaugeColor(result.hybridAnalysis.finalRiskScore) }}>
                          {Math.round(result.hybridAnalysis.finalRiskScore)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fake Probability */}
                  <div className="glass-card p-6 flex flex-col items-center justify-center">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 text-center">
                      Fake Probability
                    </div>
                    <div className="text-5xl font-extrabold mb-1" style={{ color: getRiskGaugeColor(result.hybridAnalysis.finalFakeProbability) }}>
                      {Math.round(result.hybridAnalysis.finalFakeProbability)}%
                    </div>
                    <div className="w-full mt-2 h-2 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.hybridAnalysis.finalFakeProbability}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: getRiskGaugeColor(result.hybridAnalysis.finalFakeProbability) }}
                      />
                    </div>
                  </div>

                  {/* Verdict Badge */}
                  <div className={`glass-card p-6 flex flex-col items-center justify-center border ${verdictConfig?.border}`}>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 text-center">
                      Final Verdict
                    </div>
                    <div className={`w-16 h-16 rounded-full ${verdictConfig?.bg} flex items-center justify-center mb-3`}>
                      {verdictConfig && (() => { const Icon = verdictConfig.icon; return <Icon className={`text-3xl ${verdictConfig.color}`} />; })()}
                    </div>
                    <div className={`text-lg font-bold ${verdictConfig?.color}`}>
                      {verdictConfig?.label}
                    </div>
                  </div>
                </div>

                {/* ---- Model Comparison ---- */}
                <div className="glass-card p-6">
                  <h3 className="text-black dark:text-white font-semibold text-lg mb-4 flex items-center gap-2">
                    <FiShield className="text-gray-400" />
                    Model Comparison
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Local Behavioral Analysis", score: result.internalAnalysis?.fakeProbability || 0, desc: "Internal ML Score", weight: `${result.hybridAnalysis.weights.internal}%` },
                      { label: "Advanced Ensemble Verification", score: result.externalAnalysis?.unavailable ? 0 : (result.externalAnalysis?.fakeProbability || 0), desc: "External API Score", weight: `${result.hybridAnalysis.weights.external}%` },
                      { label: "Hybrid AI Fraud Detection", score: result.hybridAnalysis.finalFakeProbability, desc: "Final Hybrid Score", weight: "100%" },
                    ].map((model, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 p-4 rounded-lg">
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <div className="text-sm font-medium text-black dark:text-white">{model.label}</div>
                            <div className="text-[10px] text-gray-400">{model.desc} • Wt: {model.weight}</div>
                          </div>
                          <div className="text-lg font-bold" style={{ color: getRiskGaugeColor(model.score || 0) }}>
                            {Math.round(model.score || 0)}%
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${model.score}%` }}
                            transition={{ duration: 0.8, delay: 0.5 + (idx * 0.1) }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: getRiskGaugeColor(model.score || 0) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ---- AI Prediction Insights ---- */}
                {result.hybridAnalysis.aiExplanation && (
                  <div className="glass-card p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-neutral-800 pb-4 mb-4">
                      <h3 className="text-black dark:text-white font-semibold text-lg flex items-center gap-2">
                        <FiCpu className="text-gray-400" />
                        AI Prediction Insights
                      </h3>
                      {result.hybridAnalysis.aiRiskLevel && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider text-gray-400">AI Risk Level:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            result.hybridAnalysis.aiRiskLevel === "HIGH"
                              ? "bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-200 dark:border-red-500/30"
                              : result.hybridAnalysis.aiRiskLevel === "MEDIUM"
                              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-200 dark:border-amber-500/30"
                              : "bg-green-50 dark:bg-green-500/10 text-green-500 border border-green-200 dark:border-green-500/30"
                          }`}>
                            {result.hybridAnalysis.aiRiskLevel}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-mono">Prediction Summary</div>
                          <div className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
                            ML Verdict:
                            <span className={
                              result.hybridAnalysis.finalVerdict === "HIGHLY FAKE" ? "text-red-500" :
                              result.hybridAnalysis.finalVerdict === "SUSPICIOUS" ? "text-amber-500" : "text-green-500"
                            }>
                              {result.hybridAnalysis.finalVerdict}
                            </span>
                            ({result.hybridAnalysis.finalFakeProbability}% probability)
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-mono">AI Assessment</div>
                          <div>{parseMarkdown(result.hybridAnalysis.aiExplanation)}</div>
                        </div>
                      </div>

                      {result.hybridAnalysis.aiSuggestions && result.hybridAnalysis.aiSuggestions.length > 0 && (
                        <div className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 p-4 rounded-lg h-fit">
                          <div className="text-xs text-black dark:text-white font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <FiCheckCircle className="text-green-500 shrink-0" /> Safety Suggestions
                          </div>
                          <ul className="space-y-2">
                            {result.hybridAnalysis.aiSuggestions.map((suggestion, idx) => (
                              <li key={idx} className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                <span className="text-black dark:text-white select-none font-bold">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ---- Risk Reasons ---- */}
                {result.hybridAnalysis.combinedReasons.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="text-black dark:text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <FiFileText className="text-gray-400" />
                      Risk Analysis Breakdown
                    </h3>
                    <div className="space-y-3">
                      {result.hybridAnalysis.combinedReasons.map((reason, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700"
                        >
                          <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            reason.weight > 0
                              ? "bg-red-50 dark:bg-red-500/10 text-red-500"
                              : "bg-green-50 dark:bg-green-500/10 text-green-500"
                          }`}>
                            {reason.weight > 0 ? <FiAlertTriangle className="text-sm" /> : <FiCheckCircle className="text-sm" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-black dark:text-white text-sm font-medium">{reason.signal}</span>
                              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                                reason.weight > 0
                                  ? "bg-red-50 dark:bg-red-500/10 text-red-500"
                                  : "bg-green-50 dark:bg-green-500/10 text-green-500"
                              }`}>
                                {reason.weight > 0 ? "+" : ""}{reason.weight}
                              </span>
                            </div>
                            <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{reason.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---- Internal Analysis Detail ---- */}
                {result.internalAnalysis?.tabularScore !== undefined && (
                  <div className="glass-card p-6">
                    <h3 className="text-black dark:text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <FiShield className="text-gray-400" />
                      Internal Analysis Detail
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Profile Metadata Analysis", score: result.internalAnalysis.tabularScore, desc: "Account statistics & structural data", weight: "40%" },
                        { label: "Image Authenticity Analysis", score: result.internalAnalysis.imageScore, desc: "Profile picture verification", weight: "30%" },
                        { label: "Bio & Content Analysis", score: result.internalAnalysis.bioScore, desc: "Spam, phishing & language patterns", weight: "20%" },
                        { label: "Behavioral Anomaly Detection", score: result.internalAnalysis.anomalyScore, desc: "Outlier activity & bot-like behavior", weight: "10%" },
                      ].map((model, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 p-4 rounded-lg">
                          <div className="flex justify-between items-end mb-2">
                            <div>
                              <div className="text-sm font-medium text-black dark:text-white">{model.label}</div>
                              <div className="text-[10px] text-gray-400">{model.desc} • Wt: {model.weight}</div>
                            </div>
                            <div className="text-lg font-bold" style={{ color: getRiskGaugeColor(model.score || 0) }}>
                              {Math.round(model.score || 0)}%
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${model.score}%` }}
                              transition={{ duration: 0.8, delay: 0.5 + (idx * 0.1) }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: getRiskGaugeColor(model.score || 0) }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---- Blockchain Proof ---- */}
                <div className="glass-card p-6">
                  <h3 className="text-black dark:text-white font-semibold text-lg mb-4 flex items-center gap-2">
                    <FiLink className="text-gray-400" />
                    Blockchain Verification Proof
                  </h3>
                  {result.blockchainProof ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-green-100 dark:border-green-500/10">
                        <FiHash className="text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-gray-400 mb-0.5">Verification Hash</div>
                          <div className="text-sm text-black dark:text-white font-mono break-all">{result.blockchainProof.dataHash}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700">
                        <FiLink className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-gray-400 mb-0.5">Transaction Hash</div>
                          <div className="text-sm text-black dark:text-white font-mono break-all">{result.blockchainProof.txHash}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700">
                        <FiClock className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">Timestamp</div>
                          <div className="text-sm text-black dark:text-white">{new Date(result.blockchainProof.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-center">
                      <FiInfo className="mx-auto text-2xl text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-gray-400 text-sm">
                        Blockchain proof was not generated for this scan.
                      </p>
                    </div>
                  )}
                </div>

                {/* ---- Human Feedback Form ---- */}
                <div className="mt-8">
                  {!showFeedback ? (
                    <div className="glass-card p-6 text-center">
                      <h3 className="text-black dark:text-white font-semibold text-lg mb-2">
                        Was this prediction accurate?
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Your feedback helps improve our AI model.
                      </p>
                      <button
                        onClick={() => setShowFeedback(true)}
                        className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-500 hover:text-black dark:hover:text-white hover:border-gray-400 dark:hover:border-neutral-500 transition-colors text-sm font-medium cursor-pointer"
                      >
                        Incorrect — Submit Feedback
                      </button>
                    </div>
                  ) : (
                    <FeedbackForm
                      username={result.apifyData.username}
                      originalPrediction={result.hybridAnalysis.finalVerdict}
                      originalFakeProbability={result.hybridAnalysis.finalFakeProbability}
                      profileSnapshot={result.apifyData}
                      onClose={() => setShowFeedback(false)}
                    />
                  )}
                </div>

                {/* ---- Disclaimer (AFTER results) ---- */}
                <div className="mt-6 p-4 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
                  <p className="text-gray-400 text-xs text-center leading-relaxed">
                    <strong className="text-gray-500">Disclaimer:</strong> This analysis is AI-assisted and should not be considered final proof of authenticity. Results are based on heuristics and publicly available data.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ---------- Page Component ----------

export default function InstagramAnalyzerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    }>
      <AnalyzerContent />
    </Suspense>
  );
}
