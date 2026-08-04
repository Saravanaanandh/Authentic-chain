"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileNotFound from "@/components/ProfileNotFound";
import ProfileReport, { ProfileReportData } from "@/components/ProfileReport";
import { AnimatePresence, motion } from "framer-motion";

function AnalyzerContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProfileReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<{ username?: string } | null>(null);

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/");
    }
  }, [status, router]);

  // Auto-start analysis if input was passed via URL
  useEffect(() => {
    const urlInput = searchParams.get("input");
    if (urlInput && status === "authenticated" && !result && !loading) {
      setInput(urlInput);
      triggerAnalysis(urlInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, status]);

  const handleClear = () => {
    setInput("");
    setResult(null);
    setError(null);
    setValidationError(null);
  };

  const triggerAnalysis = async (analysisInput: string) => {
    if (!analysisInput.trim()) {
      setError("Please enter an Instagram URL or username.");
      return;
    }

    setLoading(true);
    setError(null);
    setValidationError(null);
    setResult(null);

    try {
      const res = await fetch("/api/instagram/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: analysisInput.trim() }),
      });

      const data: any = await res.json();

      if (!data.success) {
        if (data.stage === "PROFILE_VALIDATION") {
          setValidationError({ username: data.username || analysisInput });
        } else {
          setError(data.error || "Analysis failed.");
        }
      } else {
        setResult(data);
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
  }, [input]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-2">
              Profile Analyzer
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-lg mx-auto">
              Paste an Instagram profile URL or username. Our AI engine analyzes public data and delivers a real-time fake probability score.
            </p>
          </div>

          {/* Profile Report component with search bar enabled */}
          <ProfileReport
            data={result || {}}
            showSearchBar={true}
            input={input}
            onInputChange={setInput}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            loading={loading}
            error={error}
          />

          {/* Validation Error */}
          <AnimatePresence>
            {validationError && (
              <ProfileNotFound 
                username={validationError.username} 
                onRetry={handleClear} 
              />
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function InstagramAnalyzerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    }>
      <AnalyzerContent />
    </Suspense>
  );
}
