"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiUser } from "react-icons/fi";
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
    { href: "/about", label: "About" },
  ];

  // Show History link only for authenticated users
  if (session) {
    links.push({ href: "/history", label: "History" });
  }

  if (session?.user?.role === "admin") {
    links.push({ href: "/dashboard", label: "Dashboard" });
  }

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-200 dark:border-neutral-800"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/aclogo.png" alt="Authentic Chain Logo" className="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
            <span className="text-lg font-bold text-black dark:text-white">
              Authentic Chain
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
                      ? "text-black dark:text-white bg-gray-100 dark:bg-neutral-800"
                      : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Auth */}
            <div className="ml-2 flex items-center">
              {session ? (
                <Link href="/profile">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors overflow-hidden">
                    {session.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <FiUser className="text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </Link>
              ) : (
                <Link href="/login">
                  <button className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors cursor-pointer">
                    Login
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white dark:bg-black border-b border-gray-200 dark:border-neutral-800"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    pathname === link.href
                      ? "bg-gray-100 dark:bg-neutral-800 text-black dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-900"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-gray-200 dark:border-neutral-800 my-2 pt-2">
                {session ? (
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiUser /> Profile
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium rounded-lg text-black dark:text-white bg-gray-100 dark:bg-neutral-800 text-center transition-colors"
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
