"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileForm from "@/components/ProfileForm";
import ResultCard from "@/components/ResultCard";

export default function AnalyzePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page heading */}
          <div className="text-center mb-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              Analyze a <span className="gradient-text">Profile</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Fill in the social media profile details below. Our multi-layer engine will analyze the data and return a risk score with blockchain-backed proof.
            </p>
          </div>

          {/* Form */}
          <ProfileForm onResult={setResult} />

          {/* Result */}
          <AnimatePresence>
            {result && <ResultCard result={result} />}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
}
