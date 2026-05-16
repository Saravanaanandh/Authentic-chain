"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import { useState } from "react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password?: string) => void;
  isGoogleUser: boolean;
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm, isGoogleUser }: DeleteAccountModalProps) {
  const [password, setPassword] = useState("");

  const handleConfirm = () => {
    onConfirm(isGoogleUser ? undefined : password);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md glass-card p-6 border-cyber-red/30 shadow-2xl shadow-cyber-red/10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-gray-700 dark:text-gray-300 hover:text-black dark:text-white transition-colors"
            >
              <FiX size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-cyber-red/10 border border-cyber-red/30 flex items-center justify-center mb-4">
                <FiAlertTriangle className="text-2xl text-cyber-red" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-2">Delete Account</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Are you absolutely sure? This action cannot be undone. All your history and verification data will be permanently deleted.
              </p>

              {!isGoogleUser && (
                <div className="w-full mb-6">
                  <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm your password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 text-black dark:text-white placeholder:text-gray-500 dark:text-gray-400 focus:outline-none focus:border-cyber-red/50 transition-colors"
                  />
                </div>
              )}

              <div className="flex w-full gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-black dark:text-white font-medium hover:bg-gray-200 dark:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!isGoogleUser && password.length === 0}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-cyber-red/10 border border-cyber-red/50 text-cyber-red font-medium hover:bg-cyber-red hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
