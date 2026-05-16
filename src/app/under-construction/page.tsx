"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FiTool, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

export default function UnderConstructionPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center pt-16 px-4">
        {/* Background orbs */}
        <div className="fixed top-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-cyber-pink/8 blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-150px] right-[-80px] w-[400px] h-[400px] rounded-full bg-brand-600/8 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full glass-card p-10 text-center relative z-10"
        >
          <div className="w-20 h-20 mx-auto bg-brand-500/20 border-2 border-brand-500/40 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <FiTool className="text-4xl text-brand-700 dark:text-brand-400 animate-pulse" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-black dark:text-white mb-3">
            Waiting Under <span className="gradient-text">Building</span>
          </h1>
          
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
            This feature is currently under development. We are working hard to bring you this feature soon. Stay tuned!
          </p>

          <Link href="/">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:bg-zinc-700 text-black dark:text-white font-medium transition-colors border border-surface-500">
              <FiArrowLeft /> Return Home
            </button>
          </Link>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
