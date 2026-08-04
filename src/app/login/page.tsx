"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { FiMail, FiLock, FiAlertTriangle, FiLoader, FiArrowRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password: password.trim(),
        callbackUrl,
      });

      if (res?.error) {
        setError(res.error || "Invalid email or password.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center pt-24 pb-16 px-4 bg-black text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md glass-card p-8 sm:p-10"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-400">
              Please sign in to access profile analysis
            </p>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 focus:border-neutral-600 focus:outline-none transition-colors text-sm text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 focus:border-neutral-600 focus:outline-none transition-colors text-sm text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2"
                >
                  <FiAlertTriangle className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-white hover:bg-gray-200 text-black font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin text-sm" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800"></div>
            </div>
            <span className="relative px-3 bg-black text-xs text-gray-500 uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-neutral-800 bg-neutral-950 text-white font-medium hover:bg-neutral-900 transition-colors cursor-pointer text-sm disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          {/* Direct Link to Register */}
          <div className="mt-8 text-center text-xs text-gray-500">
            Don't have an account?{" "}
            <Link href="/register" className="text-white hover:underline font-semibold ml-1">
              Create an Account
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
