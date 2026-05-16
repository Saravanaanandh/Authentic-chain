"use client";

import { FiShield, FiGithub, FiHeart } from "react-icons/fi";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-300 dark:border-zinc-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
          <FiShield className="text-brand-700 dark:text-brand-400" />
          <span>FakeID Analyzer &copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-xs">
          <Link href="/privacy-policy" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/data-deletion" className="hover:text-black dark:hover:text-white transition-colors">Data Deletion</Link>
          <span className="flex items-center gap-1">Developed By<FiHeart className="text-cyber-pink" /> Fantastic Four</span>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white transition-colors"><FiGithub size={16} /></a>
        </div>
      </div>
    </footer>
  );
}
