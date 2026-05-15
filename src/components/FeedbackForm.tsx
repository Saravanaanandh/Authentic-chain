"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiMessageSquare, FiSend, FiLoader, FiCheckCircle } from "react-icons/fi";

interface FeedbackFormProps {
  username: string;
  originalPrediction: string;
  originalFakeProbability: number;
  profileSnapshot?: any;
  onClose?: () => void;
}

export default function FeedbackForm({
  username,
  originalPrediction,
  originalFakeProbability,
  profileSnapshot,
  onClose,
}: FeedbackFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    userCorrectedLabel: "",
    feedbackReason: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userCorrectedLabel || !form.feedbackReason) {
      setError("Please fill out required fields.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          sourcePlatform: "instagram",
          originalPrediction,
          originalFakeProbability,
          userCorrectedLabel: form.userCorrectedLabel,
          feedbackReason: form.feedbackReason,
          notes: form.notes,
          profileSnapshot,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to submit feedback.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card p-6 text-center border-cyber-green/30 bg-cyber-green/5">
        <FiCheckCircle className="mx-auto text-4xl text-cyber-green mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Feedback Submitted!</h3>
        <p className="text-sm text-slate-400 mb-4">
          Thank you. Your correction helps improve the AI model.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-700 hover:bg-surface-600 rounded-lg text-sm text-white transition-colors"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <FiMessageSquare className="text-brand-400 text-xl" />
        <h3 className="text-lg font-bold text-white">Submit Correction</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Actual Result <span className="text-cyber-red">*</span>
          </label>
          <select
            value={form.userCorrectedLabel}
            onChange={(e) => setForm({ ...form, userCorrectedLabel: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-brand-500/20 text-white focus:outline-none focus:border-brand-400/60 text-sm"
            required
          >
            <option value="">Select correct label...</option>
            <option value="Real">Real</option>
            <option value="Fake">Fake</option>
            <option value="Suspicious">Suspicious</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Reason <span className="text-cyber-red">*</span>
          </label>
          <select
            value={form.feedbackReason}
            onChange={(e) => setForm({ ...form, feedbackReason: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-brand-500/20 text-white focus:outline-none focus:border-brand-400/60 text-sm"
            required
          >
            <option value="">Select reason...</option>
            <option value="Real profile with genuine followers">Real profile with genuine followers</option>
            <option value="Official business">Official business</option>
            <option value="Verified manually">Verified manually</option>
            <option value="Fake bot">Fake bot</option>
            <option value="Spam">Spam</option>
            <option value="Impersonation">Impersonation</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Notes / Explanation (Optional)
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-brand-500/20 text-white focus:outline-none focus:border-brand-400/60 text-sm resize-none"
            rows={3}
            placeholder="Add any extra details..."
          />
        </div>

        <div className="flex gap-2 justify-end mt-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 text-sm transition-colors"
            >
              Cancel
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-500 transition-colors disabled:opacity-50"
          >
            {loading ? <FiLoader className="animate-spin" /> : <FiSend />}
            Submit
          </motion.button>
        </div>
      </form>
    </div>
  );
}
