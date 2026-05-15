"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCpu, FiTrendingUp, FiCheckCircle, FiClock, FiActivity, FiLayers, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import Navbar from "@/components/Navbar";

export default function RetrainDashboard() {
  const [pendingFeedback, setPendingFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState<any>(null);

  useEffect(() => {
    fetchPendingFeedback();
  }, []);

  const fetchPendingFeedback = async () => {
    try {
      const res = await fetch("/api/feedback/pending");
      const data = await res.json();
      if (data.success) {
        setPendingFeedback(data.pendingFeedback || []);
      }
    } catch (error) {
      console.error("Failed to fetch feedback", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainResult(null);
    try {
      const res = await fetch("/api/model/retrain", { method: "POST" });
      const data = await res.json();
      setRetrainResult(data);
    } catch (error) {
      setRetrainResult({ success: false, error: "Failed to retrain" });
    } finally {
      setRetraining(false);
      fetchPendingFeedback();
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 pt-24 px-4 pb-16">
      <Navbar />
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FiCpu className="text-brand-400" /> Model Retraining & Feedback
          </h1>
          <p className="text-slate-400 mt-2">
            Review user feedback, manage training data, and trigger incremental model retraining.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <FiLayers className="text-cyber-blue text-xl" />
              <h3 className="text-lg font-semibold text-white">Pending Queue</h3>
            </div>
            <p className="text-3xl font-black text-white">{pendingFeedback.length}</p>
            <p className="text-xs text-slate-500 mt-1">Awaiting admin review</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <FiTrendingUp className="text-cyber-green text-xl" />
              <h3 className="text-lg font-semibold text-white">Accuracy Deltas</h3>
            </div>
            <p className="text-3xl font-black text-white">+2.4%</p>
            <p className="text-xs text-slate-500 mt-1">Since last retrain (v1.0.4)</p>
          </div>

          <div className="glass-card p-6 border-brand-500/30">
            <div className="flex items-center gap-3 mb-2">
              <FiActivity className="text-brand-400 text-xl" />
              <h3 className="text-lg font-semibold text-white">Action</h3>
            </div>
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="w-full mt-2 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {retraining ? <FiRefreshCw className="animate-spin" /> : <FiCpu />}
              {retraining ? "Retraining in progress..." : "Trigger Model Retrain"}
            </button>
            {retrainResult && (
              <p className={`text-xs mt-3 text-center ${retrainResult.success ? "text-cyber-green" : "text-cyber-red"}`}>
                {retrainResult.success ? `Success! Deployed ${retrainResult.version}` : "Retraining failed or skipped"}
              </p>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FiClock className="text-slate-400" /> Pending Feedback Queue
          </h2>
          
          {loading ? (
            <p className="text-slate-400">Loading feedback queue...</p>
          ) : pendingFeedback.length === 0 ? (
            <div className="p-8 text-center bg-surface-800/50 rounded-xl border border-surface-700">
              <FiCheckCircle className="text-4xl text-cyber-green mx-auto mb-3" />
              <p className="text-slate-300">No pending feedback to review!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-700 text-xs uppercase tracking-wider text-slate-500">
                    <th className="p-3">Profile</th>
                    <th className="p-3">Original</th>
                    <th className="p-3">Corrected</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pendingFeedback.map((fb, i) => (
                    <tr key={i} className="border-b border-surface-800 hover:bg-surface-800/30">
                      <td className="p-3 font-medium text-white">@{fb.username}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${fb.originalPrediction === "Fake" ? "bg-cyber-red/20 text-cyber-red" : "bg-cyber-green/20 text-cyber-green"}`}>
                          {fb.originalPrediction} ({Math.round(fb.originalFakeProbability)}%)
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${fb.userCorrectedLabel === "Fake" ? "bg-cyber-red/20 text-cyber-red" : "bg-cyber-green/20 text-cyber-green"}`}>
                          {fb.userCorrectedLabel}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs truncate" title={fb.feedbackReason}>
                        {fb.feedbackReason}
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(fb.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
