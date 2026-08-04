"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-200 dark:border-neutral-800 mt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
          <span>Authentic Chain &copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400 dark:text-gray-500 text-xs">
          <Link href="/privacy-policy" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/data-deletion" className="hover:text-black dark:hover:text-white transition-colors">Data Deletion</Link>
          <Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">Terms</Link>
          <span>Developed by <span className="font-bold text-white">Fantastic Four</span></span>
        </div>
      </div>
    </footer>
  );
}
