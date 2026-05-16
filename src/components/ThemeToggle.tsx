"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-full rounded-xl bg-gray-100 dark:bg-zinc-900 animate-pulse"></div>;
  }

  const options = [
    { value: "light", icon: FiSun, label: "Light" },
    { value: "system", icon: FiMonitor, label: "System" },
    { value: "dark", icon: FiMoon, label: "Dark" },
  ];

  return (
    <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-100 dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-800">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors z-10 ${
              isActive ? "text-black dark:text-white" : "text-gray-700 dark:text-gray-300 hover:text-black dark:text-white"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="theme-pill"
                className="absolute inset-0 bg-brand-600 border border-brand-500/50 rounded-lg -z-10 shadow-lg shadow-brand-600/30"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <Icon />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
