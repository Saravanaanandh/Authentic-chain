"use client";

import { motion } from "framer-motion";
import {
  FiShield,
  FiCpu,
  FiDatabase,
  FiLink,
  FiImage,
  FiCheckCircle,
  FiLock,
  FiZap,
  FiTrendingUp,
  FiGlobe,
} from "react-icons/fi";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const features = [
  {
    icon: FiCpu,
    title: "AI-Powered Analysis",
    desc: "Multi-layer rule-based engine scores profiles across 6+ risk signals in real-time using 70/30 hybrid ML.",
  },
  {
    icon: FiImage,
    title: "Image Comparison",
    desc: "SHA-256 image hashing detects duplicate profile pictures and impersonation attempts.",
  },
  {
    icon: FiLink,
    title: "Blockchain Proof",
    desc: "Every verification result is anchored on-chain — tamper-proof and auditable forever.",
  },
  {
    icon: FiDatabase,
    title: "Persistent Storage",
    desc: "Verified profiles are stored with deduplication — query historical data anytime.",
  },
  {
    icon: FiLock,
    title: "Privacy-First",
    desc: "Only cryptographic hashes are stored on-chain. Full profile data never leaves the backend.",
  },
  {
    icon: FiZap,
    title: "Instant Results",
    desc: "Sub-second classification with detailed risk breakdowns and actionable insights.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Paste Profile URL",
    desc: "Enter any Instagram profile URL or username into the search box.",
    icon: FiGlobe,
  },
  {
    step: "02",
    title: "AI Analysis",
    desc: "Our engine runs 9+ risk checks, image comparison, and data hashing using hybrid ML models.",
    icon: FiCpu,
  },
  {
    step: "03",
    title: "Get Results",
    desc: "Receive a REAL, SUSPICIOUS, or FAKE verdict with blockchain proof and detailed breakdown.",
    icon: FiCheckCircle,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-black dark:text-white mb-4">
              About Authentic Chain
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Our AI-driven multi-layer engine analyzes social media profiles in
              real-time — scoring risk across followers, posts, account age,
              images and more. Every result is anchored on the blockchain for
              tamper-proof trust.
            </p>
          </motion.div>

          {/* Project Overview */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">
              Project Overview
            </h2>
            <div className="glass-card p-6 sm:p-8 max-w-3xl mx-auto">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Authentic Chain (FakeID Analyzer) is an enterprise-grade fake profile detection system 
                that combines multiple AI analysis layers, external ML APIs, and blockchain verification 
                to determine the authenticity of social media profiles.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                The system uses a 70/30 hybrid scoring engine that fuses internal behavioral analysis 
                with advanced ensemble verification from external ML services, providing a comprehensive 
                and reliable fake probability score.
              </p>
            </div>
          </motion.section>

          {/* Features Grid */}
          <motion.section className="mb-20">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-8 text-center">
              Features
            </h2>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {features.map((f) => (
                <motion.div
                  key={f.title}
                  variants={itemVariants}
                  className="glass-card p-6 flex flex-col gap-3 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                    <f.icon className="text-black dark:text-white text-lg" />
                  </div>
                  <h3 className="text-black dark:text-white font-semibold">
                    {f.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          {/* How It Works */}
          <motion.section className="mb-20">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-8 text-center">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {howItWorks.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="glass-card p-6 text-center relative"
                >
                  <div className="absolute top-3 right-4 text-5xl font-black text-gray-100 dark:text-neutral-800 select-none">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center relative z-10">
                    <item.icon className="text-black dark:text-white text-xl" />
                  </div>
                  <h3 className="text-black dark:text-white font-semibold text-lg mb-2 relative z-10">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm relative z-10">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* AI Workflow */}
          <motion.section className="mb-20">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-8 text-center">
              AI Workflow
            </h2>
            <div className="glass-card p-6 sm:p-8 max-w-3xl mx-auto">
              <div className="space-y-4">
                {[
                  { label: "Data Collection", desc: "Apify scrapes public Instagram profile data including followers, posts, bio, and profile picture." },
                  { label: "Internal ML Analysis", desc: "Profile metadata analysis (40%), image authenticity (30%), bio & content analysis (20%), and behavioral anomaly detection (10%)." },
                  { label: "External Ensemble Verification", desc: "Advanced ML model validates predictions through an independent external API." },
                  { label: "Hybrid Fusion", desc: "70% internal + 30% external scores are combined for the final fake probability." },
                  { label: "Blockchain Anchoring", desc: "SHA-256 hash of the result is stored on Ethereum Sepolia for immutable proof." },
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-bold text-black dark:text-white">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-black dark:text-white font-medium text-sm">
                        {step.label}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Privacy & Benefits */}
          <motion.section className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiLock className="text-black dark:text-white text-xl" />
                  <h3 className="text-xl font-bold text-black dark:text-white">Privacy</h3>
                </div>
                <ul className="space-y-2 text-gray-500 dark:text-gray-400 text-sm">
                  <li>• Only cryptographic hashes stored on-chain</li>
                  <li>• Full profile data stays on secure backend</li>
                  <li>• User history is private and user-scoped</li>
                  <li>• GDPR-compliant data deletion available</li>
                  <li>• No data sold to third parties</li>
                </ul>
              </div>
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiTrendingUp className="text-black dark:text-white text-xl" />
                  <h3 className="text-xl font-bold text-black dark:text-white">Benefits</h3>
                </div>
                <ul className="space-y-2 text-gray-500 dark:text-gray-400 text-sm">
                  <li>• Real-time profile authenticity verification</li>
                  <li>• Immutable blockchain-backed proof</li>
                  <li>• AI-powered with human feedback loop</li>
                  <li>• Sub-second analysis speed</li>
                  <li>• Detailed risk breakdown with suggestions</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Future Scope */}
          <motion.section>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">
              Future Scope
            </h2>
            <div className="glass-card p-6 sm:p-8 max-w-3xl mx-auto">
              <ul className="space-y-3 text-gray-500 dark:text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <FiShield className="mt-0.5 text-black dark:text-white flex-shrink-0" />
                  Multi-platform support (Twitter, Facebook, LinkedIn)
                </li>
                <li className="flex items-start gap-2">
                  <FiShield className="mt-0.5 text-black dark:text-white flex-shrink-0" />
                  Real-time monitoring and alert system
                </li>
                <li className="flex items-start gap-2">
                  <FiShield className="mt-0.5 text-black dark:text-white flex-shrink-0" />
                  Browser extension for instant verification
                </li>
                <li className="flex items-start gap-2">
                  <FiShield className="mt-0.5 text-black dark:text-white flex-shrink-0" />
                  Deep learning image analysis for AI-generated photos
                </li>
                <li className="flex items-start gap-2">
                  <FiShield className="mt-0.5 text-black dark:text-white flex-shrink-0" />
                  Public API for third-party integrations
                </li>
              </ul>
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />
    </>
  );
}
