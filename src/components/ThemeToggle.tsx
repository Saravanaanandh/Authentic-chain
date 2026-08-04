"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-20 rounded-full bg-gray-100 dark:bg-neutral-800 animate-pulse"></div>;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
      aria-label="Toggle theme"
    >
      <FiSun className={`text-sm transition-opacity ${isDark ? "opacity-40" : "opacity-100 text-black"}`} />
      <div className="relative w-8 h-4 rounded-full bg-gray-300 dark:bg-neutral-600">
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-black dark:bg-white transition-transform duration-200 ${
            isDark ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
      <FiMoon className={`text-sm transition-opacity ${isDark ? "opacity-100 text-white" : "opacity-40"}`} />
    </button>
  );
}
