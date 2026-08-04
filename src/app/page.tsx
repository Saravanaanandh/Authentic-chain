"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiSearch, FiLoader } from "react-icons/fi";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShapeGrid from "@/components/ShapeGrid";
import ShinyText from "@/components/ShinyText";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = useCallback(() => {
    if (!input.trim()) return;

    // Auth check — redirect to login if not authenticated
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent("/")}&analyze=${encodeURIComponent(input.trim())}`);
      return;
    }

    // Navigate to analyzer page with the input
    setLoading(true);
    router.push(`/instagram-analyzer?input=${encodeURIComponent(input.trim())}`);
  }, [input, status, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAnalyze();
    }
  };

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-white dark:bg-black">
        {/* Interactive React Bits ShapeGrid background - Homepage only */}
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
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-20">
          {/* Logo / Title with React Bits ShinyText effect */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 pointer-events-none"
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

          {/* Search Box with Inline Analyze Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="w-full max-w-2xl pointer-events-auto"
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
                className="w-full pl-14 pr-36 sm:pr-40 py-4 sm:py-5 rounded-full border border-gray-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-black dark:text-white text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-600 focus:shadow-[0_1px_12px_rgba(0,0,0,0.08)] dark:focus:shadow-[0_1px_12px_rgba(255,255,255,0.05)] transition-all disabled:opacity-50"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                disabled={loading || !input.trim()}
                className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs sm:text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer z-10"
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

            {/* Auth hint */}
            {status !== "authenticated" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4"
              >
                Login required to analyze profiles
              </motion.p>
            )}
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
}
