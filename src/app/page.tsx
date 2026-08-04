"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiLoader, FiX, FiAlertTriangle } from "react-icons/fi";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShapeGrid from "@/components/ShapeGrid";
import ShinyText from "@/components/ShinyText";
import ProfileReport, { ProfileReportData } from "@/components/ProfileReport";
import ProfileNotFound from "@/components/ProfileNotFound";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProfileReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<{ username?: string } | null>(null);

  // Restore cached scan result if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem("authentic_chain_last_scan");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.apifyData) {
          setResult(parsed);
          setInput(parsed.apifyData.username || "");
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const triggerAnalysis = async (targetInput: string) => {
    if (!targetInput.trim()) return;

    // Auth check — redirect to login if not authenticated
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent("/")}&analyze=${encodeURIComponent(targetInput.trim())}`);
      return;
    }

    setLoading(true);
    setError(null);
    setValidationError(null);

    try {
      const res = await fetch("/api/instagram/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: targetInput.trim() }),
      });

      const data: any = await res.json();

      if (!data.success) {
        if (data.stage === "PROFILE_VALIDATION") {
          setValidationError({ username: data.username || targetInput });
        } else {
          setError(data.error || "Analysis failed.");
        }
      } else {
        setResult(data);
        try {
          localStorage.setItem("authentic_chain_last_scan", JSON.stringify(data));
        } catch {
          // ignore
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
  }, [input, status]);

  const handleClear = () => {
    setInput("");
    setResult(null);
    setError(null);
    setValidationError(null);
    try {
      localStorage.removeItem("authentic_chain_last_scan");
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAnalyze();
    }
  };

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-white dark:bg-black">
        {/* Interactive React Bits ShapeGrid background */}
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-60 pointer-events-auto">
          <ShapeGrid 
            speed={0.74}
            squareSize={40}
            direction="diagonal"
            borderColor="#333333"
            hoverFillColor="#222222"
            shape="square"
            hoverTrailAmount={1}
          />
        </div>

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-24 pb-16 w-full">
          {/* Header Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 pointer-events-none max-w-2xl"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-3">
              <ShinyText
                text="Authentic Chain"
                speed={2}
                delay={0}
                color="#b5b5b5"
                shineColor="#ffffff"
                spread={120}
                direction="left"
                yoyo={false}
                pauseOnHover={false}
                disabled={false}
              />
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              AI-powered fake profile detection with blockchain verification
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="w-full max-w-2xl pointer-events-auto mb-10"
          >
            <div className="relative flex items-center group">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg z-10" />
              <input
                id="search-input"
                type="text"
                placeholder="Paste Instagram Profile URL or Enter Username"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="w-full pl-14 pr-36 sm:pr-44 py-4 sm:py-5 rounded-full border border-gray-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-black dark:text-white text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-600 focus:shadow-[0_1px_12px_rgba(0,0,0,0.08)] dark:focus:shadow-[0_1px_12px_rgba(255,255,255,0.05)] transition-all disabled:opacity-50"
              />
              <div className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                {(input || result) && (
                  <button
                    onClick={handleClear}
                    className="p-2 rounded-full text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                    title="Clear"
                  >
                    <FiX className="text-base" />
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={loading || !input.trim()}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs sm:text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin text-sm" />
                      <span>Analyzing…</span>
                    </>
                  ) : (
                    <>
                      <FiSearch className="text-xs sm:text-sm" />
                      <span>Analyze</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Auth hint */}
            {status !== "authenticated" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4"
              >
                Login required to analyze profiles
              </motion.p>
            )}

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-500 text-sm flex items-center gap-2"
                >
                  <FiAlertTriangle className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Loading Animation */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-5xl glass-card p-12 text-center my-6"
              >
                <div className="relative mx-auto w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-neutral-700" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-black dark:border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                </div>
                <h3 className="text-black dark:text-white font-semibold text-lg mb-2">
                  Scanning & Analyzing Profile…
                </h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  Extracting metrics, verifying image authenticity, running ML models, and recording blockchain proof.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Validation Error */}
          <AnimatePresence>
            {validationError && (
              <div className="w-full max-w-5xl">
                <ProfileNotFound 
                  username={validationError.username} 
                  onRetry={handleClear} 
                />
              </div>
            )}
          </AnimatePresence>

          {/* Analysis Report View */}
          <AnimatePresence>
            {result?.success && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-5xl"
              >
                <ProfileReport data={result} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </>
  );
}
