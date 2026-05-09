"use client";

import { motion } from "framer-motion";
import {
  FiShield,
  FiCpu,
  FiDatabase,
  FiLink,
  FiImage,
  FiCheckCircle,
  FiArrowRight,
  FiActivity,
  FiLock,
  FiZap,
} from "react-icons/fi";
import Link from "next/link";

const features = [
  {
    icon: FiCpu,
    title: "AI-Powered Analysis",
    desc: "Multi-layer rule-based engine scores profiles across 6+ risk signals in real-time.",
    color: "from-brand-500 to-cyber-blue",
  },
  {
    icon: FiImage,
    title: "Image Comparison",
    desc: "SHA-256 image hashing detects duplicate profile pictures and impersonation attempts.",
    color: "from-cyber-pink to-brand-400",
  },
  {
    icon: FiLink,
    title: "Blockchain Proof",
    desc: "Every verification result is anchored on-chain — tamper-proof and auditable forever.",
    color: "from-cyber-green to-cyber-blue",
  },
  {
    icon: FiDatabase,
    title: "Persistent Storage",
    desc: "Verified profiles are stored with deduplication — query historical data anytime.",
    color: "from-cyber-amber to-cyber-pink",
  },
  {
    icon: FiLock,
    title: "Privacy-First",
    desc: "Only cryptographic hashes are stored on-chain. Full profile data never leaves the backend.",
    color: "from-brand-300 to-cyber-purple",
  },
  {
    icon: FiZap,
    title: "Instant Results",
    desc: "Sub-second classification with detailed risk breakdowns and actionable insights.",
    color: "from-cyber-blue to-cyber-green",
  },
];

const stats = [
  { value: "6+", label: "Risk Signals" },
  { value: "SHA-256", label: "Data Integrity" },
  { value: "<1s", label: "Analysis Time" },
  { value: "100%", label: "On-Chain Proof" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* ---- Decorative background orbs ---- */}
      <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-brand-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[-80px] w-[400px] h-[400px] rounded-full bg-cyber-pink/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyber-blue/5 blur-[140px] pointer-events-none" />

      {/* ---- Hero Content ---- */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-semibold tracking-wider uppercase"
        >
          <FiActivity className="text-cyber-green animate-pulse" />
          System Online — v1.0
        </motion.div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
          <span className="text-white">Detect </span>
          <span className="gradient-text">Fake Profiles</span>
          <br />
          <span className="text-white">With </span>
          <span className="gradient-text">Precision</span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Our AI-driven multi-layer engine analyzes social media profiles in
          real-time — scoring risk across followers, posts, account age, images
          and more. Every result is anchored on the blockchain for
          tamper-proof trust.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/instagram-analyzer">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(236,72,153,0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyber-pink to-cyber-purple text-white font-semibold text-base shadow-lg shadow-cyber-pink/25 transition-all cursor-pointer"
            >
              <FiImage className="text-lg" />
              Profile Analyzer
              <FiArrowRight className="text-lg group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
          <Link href="/history">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-brand-500/30 text-brand-300 font-semibold text-base hover:bg-brand-500/10 transition-all cursor-pointer"
            >
              <FiDatabase className="text-lg" />
              View History
            </motion.button>
          </Link>
        </div>

        {/* Stats row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-20"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={itemVariants}
              className="glass-card px-4 py-4 text-center"
            >
              <div className="text-2xl font-bold gradient-text mb-1">
                {s.value}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ---- Feature Grid ---- */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10"
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={itemVariants}
            whileHover={{ y: -6, borderColor: "rgba(99,102,241,0.4)" }}
            className="glass-card glass-card-hover p-6 flex flex-col gap-4 transition-all duration-300"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}
            >
              <f.icon className="text-white text-xl" />
            </div>
            <h3 className="text-white font-semibold text-lg">{f.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ---- How It Works ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto w-full mt-24 relative z-10"
      >
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          How It <span className="gradient-text">Works</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Submit Profile",
              desc: "Enter the social media profile details you want to verify.",
              icon: FiShield,
            },
            {
              step: "02",
              title: "AI Analysis",
              desc: "Our engine runs 6+ risk checks, image comparison, and data hashing.",
              icon: FiCpu,
            },
            {
              step: "03",
              title: "Get Results",
              desc: "Receive a REAL, SUSPICIOUS, or FAKE verdict with blockchain proof.",
              icon: FiCheckCircle,
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="glass-card p-6 text-center relative overflow-hidden group"
            >
              <div className="absolute -top-4 -right-4 text-7xl font-black text-brand-500/5 group-hover:text-brand-500/10 transition-colors">
                {item.step}
              </div>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                <item.icon className="text-brand-400 text-2xl" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                {item.title}
              </h3>
              <p className="text-slate-400 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
