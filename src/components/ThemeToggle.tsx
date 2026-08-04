"use client";

import { FiMoon } from "react-icons/fi";

export default function ThemeToggle() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900 text-xs font-medium text-gray-300">
      <FiMoon className="text-white text-xs" />
      <span>Dark Mode</span>
    </div>
  );
}
