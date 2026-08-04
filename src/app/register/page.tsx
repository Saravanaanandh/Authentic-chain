"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { FiUser, FiMail, FiLock, FiAlertTriangle, FiLoader, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed. Please try again.");
        setLoading(false);
      } else {
        setSuccess(true);
        // Automatically sign in the user right after registration and redirect to homepage
        await signIn("credentials", {
          redirect: true,
          email: email.trim(),
          password: password.trim(),
          callbackUrl: "/",
        });
      }
    } catch {
      setError("An unexpected network error occurred.");
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
              Create Account
            </h1>
            <p className="text-sm text-gray-400">
              Sign up to verify social media profiles
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.form
                key="register-form"
                onSubmit={handleRegister}
                className="space-y-4"
              >
                {/* Name Input */}
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 focus:border-neutral-600 focus:outline-none transition-colors text-sm text-white placeholder:text-gray-600"
                    />
                  </div>
                </div>

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
                  <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      id="password"
                      type="password"
                      placeholder="•••••••• (Min. 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      minLength={6}
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
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign Up</span>
                      <FiArrowRight />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="register-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/30 text-green-500">
                  <FiCheckCircle className="text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-white">Account Created!</h3>
                <p className="text-sm text-gray-400">
                  Logging you in and redirecting to home...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Direct Link to Login */}
          <div className="mt-8 text-center text-xs text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-white hover:underline font-semibold ml-1">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
