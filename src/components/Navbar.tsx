"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiShield, FiMenu, FiX, FiUser } from "react-icons/fi";
import { useSession } from "next-auth/react";

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
    { href: "/instagram-analyzer", label: "Analyze" },
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
          ? "bg-white dark:bg-black/80 backdrop-blur-xl border-b border-gray-300 dark:border-zinc-800 shadow-lg shadow-brand-500/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="p-2 rounded-lg bg-brand-600/20 border border-gray-300 dark:border-zinc-800 group-hover:border-brand-400/60 transition-colors"
            >
              <FiShield className="text-brand-700 dark:text-brand-400 text-xl" />
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
                      ? "text-black dark:text-white"
                      : "text-gray-700 dark:text-gray-300 hover:text-black dark:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-brand-600/20 border border-gray-300 dark:border-zinc-800 rounded-lg"
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
                  <Link href="/profile">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-zinc-800 bg-brand-600/10 text-brand-700 dark:text-brand-300 hover:bg-brand-600/20 transition-colors overflow-hidden"
                    >
                      {session.user?.image ? (
                        <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser />
                      )}
                    </motion.div>
                  </Link>
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
            className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-black dark:text-white"
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
            className="md:hidden overflow-hidden bg-white dark:bg-black/95 backdrop-blur-xl border-b border-gray-300 dark:border-zinc-800"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    pathname === link.href
                      ? "bg-brand-600/20 text-white border border-gray-300 dark:border-zinc-800"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-zinc-800 hover:text-black dark:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-gray-300 dark:border-zinc-800 my-2 pt-2">
                {session ? (
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium rounded-lg text-brand-700 dark:text-brand-300 hover:bg-gray-200 dark:bg-zinc-800 hover:text-black dark:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiUser /> Profile
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium rounded-lg text-brand-700 dark:text-brand-400 hover:bg-gray-200 dark:bg-zinc-800 hover:text-black dark:text-white transition-colors"
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
