"use client";

import { motion } from "framer-motion";
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiLink, FiHash, FiClock, FiShield, FiImage } from "react-icons/fi";

interface Reason { rule: string; detail: string; riskAdded: number; }

interface ResultData {
  id: string;
  username: string;
  riskScore: number;
  status: "REAL" | "SUSPICIOUS" | "FAKE";
  reasons: Reason[];
  dataHash: string;
  imageHash: string;
  imageUrl?: string;
  blockchainTx: string;
  createdAt: string;
}

const statusConfig = {
  REAL: { icon: FiCheckCircle, color: "text-cyber-green", bg: "bg-cyber-green/10", border: "border-cyber-green/30", label: "Verified Real", gauge: "#10b981" },
  SUSPICIOUS: { icon: FiAlertTriangle, color: "text-cyber-amber", bg: "bg-cyber-amber/10", border: "border-cyber-amber/30", label: "Suspicious", gauge: "#f59e0b" },
  FAKE: { icon: FiXCircle, color: "text-cyber-red", bg: "bg-cyber-red/10", border: "border-cyber-red/30", label: "Fake Detected", gauge: "#ef4444" },
};

export default function ResultCard({ result }: { result: ResultData | null }) {
  if (!result) return null;
  const cfg = statusConfig[result.status];
  const Icon = cfg.icon;
  const pct = `${result.riskScore}%`;

  return (
    <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, type: "spring" }} className="glass-card p-6 sm:p-8 w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${cfg.bg} border ${cfg.border}`}><Icon className={`${cfg.color} text-xl`} /></div>
          <div><h2 className="text-xl font-bold text-black dark:text-white">Analysis Result</h2><p className="text-xs text-gray-500 dark:text-gray-400">@{result.username}</p></div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cfg.label}</span>
      </div>

      {/* Profile Image from Cloudinary */}
      {result.imageUrl && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex justify-center">
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.imageUrl} alt={`${result.username} profile`} className="w-28 h-28 rounded-2xl object-cover border-2 border-gray-300 dark:border-zinc-800 shadow-lg shadow-brand-600/20" />
            <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-full ${cfg.bg} border ${cfg.border}`}>
              <Icon className={`${cfg.color} text-sm`} />
            </div>
            <div className="absolute -top-2 -left-2 p-1.5 rounded-full bg-gray-200 dark:bg-zinc-800/80 border border-gray-300 dark:border-zinc-800">
              <FiImage className="text-brand-700 dark:text-brand-400 text-xs" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Gauge */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(30,30,60,0.5)" strokeWidth="10" />
            <circle cx="60" cy="60" r="52" fill="none" stroke={cfg.gauge} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(result.riskScore / 100) * 327} 327`}>
              <animate attributeName="stroke-dasharray" from="0 327" to={`${(result.riskScore / 100) * 327} 327`} dur="1s" fill="freeze" />
            </circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${cfg.color}`}>{result.riskScore}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk Score</span>
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">Risk level: <strong className={cfg.color}>{pct}</strong></p>
      </div>

      {/* Reasons */}
      {result.reasons.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-black dark:text-white flex items-center gap-2"><FiShield className="text-brand-700 dark:text-brand-400" /> Detection Reasons</h3>
          <div className="space-y-2">
            {result.reasons.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-start gap-3 p-3 rounded-lg bg-gray-100 dark:bg-zinc-900/40 border border-gray-300 dark:border-zinc-800">
                <span className="mt-0.5 text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-500/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0">+{r.riskAdded}</span>
                <div><p className="text-sm font-medium text-black dark:text-white">{r.rule}</p><p className="text-xs text-gray-700 dark:text-gray-300">{r.detail}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Blockchain & Hash info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-zinc-900/40 border border-gray-300 dark:border-zinc-800 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><FiHash /> Data Hash</div>
          <p className="text-xs text-brand-700 dark:text-brand-300 font-mono break-all">{result.dataHash?.slice(0, 32)}…</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-zinc-900/40 border border-gray-300 dark:border-zinc-800 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><FiLink /> Blockchain Tx</div>
          <p className="text-xs text-cyber-green font-mono break-all">{result.blockchainTx?.slice(0, 32)}…</p>
        </div>
      </div>

      {/* Image Storage Info */}
      {result.imageUrl && (
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-zinc-900/40 border border-gray-300 dark:border-zinc-800 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><FiImage /> Image Storage (Cloudinary)</div>
          <p className="text-xs text-blue-300 font-mono break-all">{result.imageUrl}</p>
        </div>
      )}

      {/* Timestamp */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><FiClock /> Verified at {new Date(result.createdAt).toLocaleString()}</div>
    </motion.div>
  );
}
