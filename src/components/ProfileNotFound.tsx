import { motion } from "framer-motion";
import { FiUserX, FiRefreshCcw } from "react-icons/fi";

interface ProfileNotFoundProps {
  username?: string;
  onRetry: () => void;
}

export default function ProfileNotFound({ username, onRetry }: ProfileNotFoundProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-10 text-center max-w-md mx-auto mt-8 border-cyber-red/30 bg-cyber-red/5"
    >
      <div className="w-20 h-20 mx-auto bg-cyber-red/10 border-2 border-cyber-red/30 rounded-full flex items-center justify-center mb-6">
        <FiUserX className="text-4xl text-cyber-red" />
      </div>
      
      <h2 className="text-2xl font-bold text-black dark:text-white mb-3">
        Profile Not Found
      </h2>
      
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
        We couldn't locate the Instagram profile {username ? <span className="font-mono text-brand-700 dark:text-brand-300">@{username}</span> : "you entered"}. 
        The account may not exist, might be misspelled, or could have been deleted.
      </p>
      
      <div className="p-4 bg-white dark:bg-black rounded-lg border border-surface-700 text-left mb-6">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Troubleshooting</h3>
        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 list-disc list-inside">
          <li>Check for typos in the username</li>
          <li>Ensure you're using the correct platform</li>
          <li>The account might be temporarily suspended</li>
        </ul>
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gray-100 dark:bg-zinc-900 border border-slate-600 text-black dark:text-white font-semibold text-sm hover:bg-gray-200 dark:bg-zinc-800 transition-all cursor-pointer"
      >
        <FiRefreshCcw />
        Try Another Profile
      </motion.button>
    </motion.div>
  );
}
