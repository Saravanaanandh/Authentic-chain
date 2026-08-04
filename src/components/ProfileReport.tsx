"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiX,
  FiUsers,
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
import FeedbackForm from "@/components/FeedbackForm";

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

interface BlockchainProof {
  txHash: string;
  dataHash: string;
  timestamp: string;
}

export interface ProfileReportData {
  success?: boolean;
  username?: string;
  apifyData?: ProfileData;
  profileData?: ProfileData;
  internalAnalysis?: any;
  externalAnalysis?: any;
  hybridAnalysis?: {
    finalFakeProbability: number;
    finalRiskScore: number;
    finalVerdict: string;
    combinedReasons: { signal: string; detail: string; weight: number }[];
    weights: { external: number; internal: number };
  };
  analysis?: {
    riskScore: number;
    fakeProbability: number;
    verdict: string;
    reasons: { signal: string; detail: string; weight: number }[];
    tabularScore?: number;
    imageScore?: number;
    bioScore?: number;
    anomalyScore?: number;
  };
  blockchainProof?: BlockchainProof | null;
  blockchainTx?: string;
  blockchainHash?: string;
  createdAt?: string;
  hasSubmittedFeedback?: boolean;
}

interface ProfileReportProps {
  data: ProfileReportData;
  showSearchBar?: boolean;
  input?: string;
  onInputChange?: (val: string) => void;
  onAnalyze?: () => void;
  onClear?: () => void;
  loading?: boolean;
  error?: string | null;
}

function formatNumber(n: number): string {
  if (!n) return "0";
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
        icon: FiCheckCircle,
        label: "Likely Real",
      };
    case "SUSPICIOUS":
      return {
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        border: "border-amber-200 dark:border-amber-500/30",
        icon: FiAlertTriangle,
        label: "Suspicious",
      };
    default:
      return {
        color: "text-red-500",
        bg: "bg-red-50 dark:bg-red-500/10",
        border: "border-red-200 dark:border-red-500/30",
        icon: FiXCircle,
        label: "Likely Fake",
      };
  }
}

function getRiskGaugeColor(score: number): string {
  if (score <= 25) return "#22c55e";
  if (score <= 55) return "#f59e0b";
  return "#ef4444";
}

export default function ProfileReport({
  data,
  showSearchBar = false,
  input = "",
  onInputChange,
  onAnalyze,
  onClear,
  loading = false,
  error = null,
}: ProfileReportProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(!!data.hasSubmittedFeedback);

  const profile = data.apifyData || data.profileData;
  const hybrid = data.hybridAnalysis || {
    finalRiskScore: data.analysis?.riskScore || 0,
    finalFakeProbability: data.analysis?.fakeProbability || 0,
    finalVerdict: data.analysis?.verdict === "FAKE" ? "HIGHLY FAKE" : (data.analysis?.verdict || "SUSPICIOUS"),
    combinedReasons: data.analysis?.reasons || [],
    weights: { external: 0, internal: 100 },
  };

  const verdictConfig = getVerdictConfig(hybrid.finalVerdict);
  const proof = data.blockchainProof || (data.blockchainTx ? {
    txHash: data.blockchainTx,
    dataHash: data.blockchainHash || "",
    timestamp: data.createdAt || new Date().toISOString()
  } : null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ---- Optional Search Bar ---- */}
      {showSearchBar && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 sm:p-8"
        >
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
            Enter Instagram Profile URL or Username
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="https://instagram.com/username  or  @username"
                value={input}
                onChange={(e) => onInputChange && onInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAnalyze && onAnalyze()}
                disabled={loading}
                className="w-full pl-12 pr-4 py-3.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-black dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500 transition-all text-sm disabled:opacity-50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={onAnalyze}
                disabled={loading || !input.trim()}
                className="flex items-center gap-2 px-6 py-3.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {loading ? <FiLoader className="animate-spin" /> : <FiSearch />}
                {loading ? "Analyzing…" : "Analyze"}
              </button>
              {(input || data.apifyData || data.profileData) && onClear && (
                <button
                  onClick={onClear}
                  className="flex items-center gap-1 px-4 py-3.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-500 hover:text-black dark:hover:text-white transition-colors text-sm cursor-pointer"
                >
                  <FiX />
                  Clear
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-500 text-sm flex items-center gap-2">
              <FiAlertTriangle />
              {error}
            </div>
          )}
        </motion.div>
      )}

      {/* ---- Profile Card Header ---- */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 flex justify-center sm:justify-start">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full overflow-hidden border-2 ${verdictConfig.border}`}>
                  {profile.profilePicUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.profilePicUrl}
                      alt={profile.username}
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
                    style={{ display: profile.profilePicUrl ? "none" : "flex" }}
                  >
                    <FiUsers className="text-3xl text-gray-400" />
                  </div>
                </div>
                {profile.verified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white dark:border-black">
                    <FiCheckCircle className="text-white text-xs" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  {profile.fullName || profile.username}
                </h2>
                {profile.verified && (
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-500 border border-blue-200 dark:border-blue-500/30 font-medium">
                    Verified
                  </span>
                )}
                {profile.isPrivate && (
                  <span className="px-2 py-0.5 rounded text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-200 dark:border-amber-500/30 font-medium">
                    Private
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm font-mono mb-3">
                @{profile.username}
              </p>
              {profile.biography && (
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4 max-w-lg">
                  {profile.biography}
                </p>
              )}

              {/* Stats Row */}
              <div className="flex items-center justify-center sm:justify-start gap-6">
                {[
                  { label: "Posts", value: formatNumber(profile.postsCount) },
                  { label: "Followers", value: formatNumber(profile.followersCount) },
                  { label: "Following", value: formatNumber(profile.followsCount) },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-black dark:text-white font-bold text-lg">{stat.value}</div>
                    <div className="text-gray-400 text-xs uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>

              {profile.externalUrl && (
                <a
                  href={profile.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  <FiExternalLink />
                  {profile.externalUrl}
                </a>
              )}
            </div>
          </div>
        </motion.div>
      )}

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
                stroke={getRiskGaugeColor(hybrid.finalRiskScore)}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(hybrid.finalRiskScore / 100) * 314} 314`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: getRiskGaugeColor(hybrid.finalRiskScore) }}>
                {Math.round(hybrid.finalRiskScore)}
              </span>
            </div>
          </div>
        </div>

        {/* Fake Probability */}
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 text-center">
            Fake Probability
          </div>
          <div className="text-5xl font-extrabold mb-1" style={{ color: getRiskGaugeColor(hybrid.finalFakeProbability) }}>
            {Math.round(hybrid.finalFakeProbability)}%
          </div>
          <div className="w-full mt-2 h-2 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${hybrid.finalFakeProbability}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: getRiskGaugeColor(hybrid.finalFakeProbability) }}
            />
          </div>
        </div>

        {/* Verdict Badge */}
        <div className={`glass-card p-6 flex flex-col items-center justify-center border ${verdictConfig.border}`}>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 text-center">
            Final Verdict
          </div>
          <div className={`w-16 h-16 rounded-full ${verdictConfig.bg} flex items-center justify-center mb-3`}>
            {(() => { const Icon = verdictConfig.icon; return <Icon className={`text-3xl ${verdictConfig.color}`} />; })()}
          </div>
          <div className={`text-lg font-bold ${verdictConfig.color}`}>
            {verdictConfig.label}
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
            { label: "Local Behavioral Analysis", score: data.internalAnalysis?.fakeProbability || data.analysis?.fakeProbability || 0, desc: "Internal ML Score", weight: `${hybrid.weights?.internal || 100}%` },
            { label: "Advanced Ensemble Verification", score: data.externalAnalysis?.unavailable ? 0 : (data.externalAnalysis?.fakeProbability || 0), desc: "External API Score", weight: `${hybrid.weights?.external || 0}%` },
            { label: "Hybrid AI Fraud Detection", score: hybrid.finalFakeProbability, desc: "Final Hybrid Score", weight: "100%" },
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

      {/* NOTE: AI Prediction Insights section REMOVED as requested */}

      {/* ---- Risk Reasons Breakdown ---- */}
      {hybrid.combinedReasons && hybrid.combinedReasons.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-black dark:text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <FiFileText className="text-gray-400" />
            Risk Analysis Breakdown
          </h3>
          <div className="space-y-3">
            {hybrid.combinedReasons.map((reason, i) => (
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

      {/* ---- Blockchain Proof ---- */}
      <div className="glass-card p-6">
        <h3 className="text-black dark:text-white font-semibold text-lg mb-4 flex items-center gap-2">
          <FiLink className="text-gray-400" />
          Blockchain Verification Proof
        </h3>
        {proof && (proof.txHash || proof.dataHash) ? (
          <div className="space-y-3">
            {proof.dataHash && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-green-100 dark:border-green-500/10">
                <FiHash className="text-green-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-400 mb-0.5">Verification Hash</div>
                  <div className="text-sm text-black dark:text-white font-mono break-all">{proof.dataHash}</div>
                </div>
              </div>
            )}
            {proof.txHash && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700">
                <FiLink className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-400 mb-0.5">Transaction Hash</div>
                  <div className="text-sm text-black dark:text-white font-mono break-all">{proof.txHash}</div>
                </div>
              </div>
            )}
            {proof.timestamp && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700">
                <FiClock className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Timestamp</div>
                  <div className="text-sm text-black dark:text-white">{new Date(proof.timestamp).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-center">
            <FiInfo className="mx-auto text-2xl text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-400 text-sm">
              Blockchain proof was recorded in history logs for this scan.
            </p>
          </div>
        )}
      </div>

      {/* ---- Human Feedback Form (Shown ONLY IF feedback has NOT been given yet) ---- */}
      {profile && !feedbackSubmitted && (
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
              username={profile.username}
              originalPrediction={hybrid.finalVerdict}
              originalFakeProbability={hybrid.finalFakeProbability}
              profileSnapshot={profile}
              onClose={() => {
                setShowFeedback(false);
                setFeedbackSubmitted(true);
              }}
            />
          )}
        </div>
      )}

      {/* ---- Disclaimer Footer ---- */}
      <div className="mt-6 p-4 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
        <p className="text-gray-400 text-xs text-center leading-relaxed">
          <strong className="text-gray-500">Disclaimer:</strong> This analysis is AI-assisted and should not be considered final proof of authenticity. Results are based on heuristics and publicly available data.
        </p>
      </div>
    </div>
  );
}
