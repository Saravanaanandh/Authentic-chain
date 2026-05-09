"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiShield, FiMenu, FiX, FiLogOut, FiUser } from "react-icons/fi";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/how-to-use", label: "How to Use" },
    { href: "/instagram-analyzer", label: "Profile Analyzer" },
    { href: "/history", label: "History" },
  ];

  if (session?.user?.role === "admin") {
    links.splice(2, 0, { href: "/dashboard", label: "Dashboard" });
  }

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-surface-900/80 backdrop-blur-xl border-b border-brand-500/20 shadow-lg shadow-brand-500/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="p-2 rounded-lg bg-brand-600/20 border border-brand-500/30 group-hover:border-brand-400/60 transition-colors"
            >
              <FiShield className="text-brand-400 text-xl" />
            </motion.div>
            <span className="text-lg font-bold gradient-text hidden sm:inline">
              FakeID Analyzer
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-brand-600/20 border border-brand-500/30 rounded-lg"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}

            {/* Auth Buttons */}
            <div className="ml-3 flex items-center gap-2">
              {session ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-500/30 bg-brand-600/10 text-brand-300">
                    {session.user?.image ? (
                      <img src={session.user.image} alt="User" className="w-5 h-5 rounded-full" />
                    ) : (
                      <FiUser />
                    )}
                    <span className="text-sm font-medium">{session.user?.name || session.user?.email}</span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-cyber-red hover:bg-cyber-red/10 transition-colors cursor-pointer"
                  >
                    <FiLogOut />
                  </button>
                </div>
              ) : (
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyber-purple text-white text-sm font-semibold shadow-lg shadow-brand-600/25 cursor-pointer transition-all"
                  >
                    Login
                  </motion.button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-surface-900/95 backdrop-blur-xl border-b border-brand-500/20"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    pathname === link.href
                      ? "bg-brand-600/20 text-white border border-brand-500/30"
                      : "text-slate-400 hover:bg-surface-700 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-brand-500/10 my-2 pt-2">
                {session ? (
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-cyber-red hover:bg-cyber-red/10 transition-colors"
                  >
                    <FiLogOut /> Logout ({session.user?.name || session.user?.email})
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium rounded-lg text-brand-400 hover:bg-surface-700 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
