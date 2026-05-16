"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

export default function TermsOfService() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-extrabold text-black dark:text-white mb-4">
              Terms of <span className="gradient-text">Service</span>
            </h1>
            <p className="text-gray-700 dark:text-gray-300">Last updated: {new Date().toLocaleDateString()}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-10 space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed"
          >
            <section>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-3">1. Acceptance of Terms</h2>
              <p>By accessing and using FakeID Shield, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-3">2. Description of Service</h2>
              <p>FakeID Shield provides ML-driven analysis of public social media profiles to assess their authenticity. The service is provided "as is" and the scores are predictive, not absolute truths.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-3">3. User Conduct</h2>
              <p>You agree not to use the service for harassment, stalking, or any illegal activities. You also agree not to spam the API or attempt to bypass rate limits.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-3">4. Limitation of Liability</h2>
              <p>FakeID Shield shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.</p>
            </section>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
