"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FiAlertTriangle, FiSearch, FiCheckCircle, FiShield, FiFileText } from "react-icons/fi";
import Link from "next/link";

export default function HowToUsePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="fixed top-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-cyber-pink/8 blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-150px] right-[-80px] w-[400px] h-[400px] rounded-full bg-brand-600/8 blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white mb-4">
              How to <span className="gradient-text">Use the Analyzer</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
              Follow this step-by-step guide to analyze an Instagram profile and understand the results. 
            </p>
          </motion.div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 border-cyber-amber/30 bg-cyber-amber/5 flex items-start gap-4"
          >
            <FiAlertTriangle className="text-cyber-amber text-2xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-cyber-amber font-semibold text-lg mb-1">Disclaimer</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                This website uses AI heuristics and public data to calculate a probability score. <strong>It is not 100% true or real, and it may make mistakes.</strong> A high fake probability does not guarantee an account is fake, and a low score does not guarantee it is real. Use these insights at your own discretion.
              </p>
            </div>
          </motion.div>

          {/* Steps */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold text-lg border border-gray-300 dark:border-zinc-800">1</div>
                <h2 className="text-xl font-bold text-black dark:text-white">Find a Profile</h2>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Navigate to Instagram and copy the URL of the profile you want to verify, or simply note down their exact username.</p>
              <div className="bg-gray-100 dark:bg-zinc-900/50 p-4 rounded-lg border border-gray-300 dark:border-zinc-700">
                <p className="text-gray-700 dark:text-gray-300 font-mono text-sm">Example: <span className="text-brand-700 dark:text-brand-300">https://instagram.com/itz__me__saravana18</span></p>
                <p className="text-gray-700 dark:text-gray-300 font-mono text-sm mt-2">Or just: <span className="text-brand-700 dark:text-brand-300">@itz__me__saravana18</span></p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold text-lg border border-gray-300 dark:border-zinc-800">2</div>
                <h2 className="text-xl font-bold text-black dark:text-white">Run the Analysis</h2>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Go to our Profile Analyzer page, paste the URL or username into the input box, and click the Analyze button. The AI engine will scrape public data and run multiple risk checks.</p>
              <Link href="/instagram-analyzer">
                <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-500 transition-colors">
                  <FiSearch /> Try it now
                </button>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold text-lg border border-gray-300 dark:border-zinc-800">3</div>
                <h2 className="text-xl font-bold text-black dark:text-white">Understand the Results</h2>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">The system will generate a comprehensive report with a Risk Score, Fake Probability, and a Verdict.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-cyber-green/10 border border-cyber-green/30 p-4 rounded-lg text-center">
                  <FiCheckCircle className="text-cyber-green text-2xl mx-auto mb-2" />
                  <h4 className="text-cyber-green font-bold mb-1">Likely Real</h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300">Low risk score. Account exhibits normal human behavior.</p>
                </div>
                <div className="bg-cyber-amber/10 border border-cyber-amber/30 p-4 rounded-lg text-center">
                  <FiAlertTriangle className="text-cyber-amber text-2xl mx-auto mb-2" />
                  <h4 className="text-cyber-amber font-bold mb-1">Suspicious</h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300">Medium risk. Mixed signals that warrant caution.</p>
                </div>
                <div className="bg-cyber-red/10 border border-cyber-red/30 p-4 rounded-lg text-center">
                  <FiShield className="text-cyber-red text-2xl mx-auto mb-2" />
                  <h4 className="text-cyber-red font-bold mb-1">Highly Fake</h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300">High risk. Strong indicators of bot or spam activity.</p>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-zinc-900/50 p-4 rounded-lg border border-gray-300 dark:border-zinc-700">
                <h4 className="text-black dark:text-white font-semibold text-sm mb-2 flex items-center gap-2"><FiFileText className="text-brand-700 dark:text-brand-400" /> Example Breakdown: @itz__me__saravana18</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>• <strong>Posts:</strong> 2 | <strong>Followers:</strong> 132 | <strong>Following:</strong> 443</li>
                  <li>• <strong>Risk Signals Triggered:</strong> Very Few Posts (+8), Private Account (+5)</li>
                  <li>• <strong>Total Risk Score:</strong> 13 / 100</li>
                  <li>• <strong className="text-cyber-green">Verdict: Likely Real</strong></li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
