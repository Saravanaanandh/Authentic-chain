"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiMail, FiLock, FiAlertTriangle, FiGithub } from "react-icons/fi"; // Used Github icon as placeholder, let's just use text for Google
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  const ic = "w-full bg-gray-100 dark:bg-zinc-900/60 border border-gray-300 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-black dark:text-white placeholder:text-gray-500 dark:text-gray-400 focus:outline-none focus:border-brand-400 transition-all text-sm";

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center pt-16 px-4">
        <div className="w-full max-w-md glass-card p-8">
          <h2 className="text-2xl font-bold text-center text-black dark:text-white mb-6">Welcome Back</h2>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm flex items-center gap-2">
              <FiAlertTriangle /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className={ic}
              />
            </div>
            
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className={ic}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-black dark:text-white font-semibold shadow-lg hover:shadow-brand-600/25 disabled:opacity-50 transition-all"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="w-1/5 border-b border-gray-300 dark:border-zinc-700 lg:w-1/4"></span>
            <span className="text-xs text-center text-gray-500 dark:text-gray-400 uppercase">or login with</span>
            <span className="w-1/5 border-b border-gray-300 dark:border-zinc-700 lg:w-1/4"></span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button 
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 dark:border-zinc-800 text-black dark:text-white font-semibold hover:bg-gray-200 dark:bg-zinc-800 transition-all"
            >
              Google
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-700 dark:text-gray-300">
            Don&apos;t have an account? <Link href="/register" className="text-brand-700 dark:text-brand-400 hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </>
  );
}
