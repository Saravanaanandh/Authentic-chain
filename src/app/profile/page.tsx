"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  FiClock, 
  FiBookOpen, 
  FiShield, 
  FiFileText, 
  FiTrash2, 
  FiLogOut,
  FiUser,
  FiAlertTriangle
} from "react-icons/fi";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  const handleDeleteConfirm = async (password?: string) => {
    // Implement delete account logic here, optionally verifying password
    // Then sign out and redirect
    setDeleteModalOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  const menuItems = [
    {
      href: "/history",
      label: "Analysis History",
      description: "View all previous profile scans",
      icon: FiClock,
    },
    {
      href: "/how-to-use",
      label: "How to Use",
      description: "Learn how Authentic Chain works",
      icon: FiBookOpen,
    },
    {
      href: "/privacy-policy",
      label: "Privacy Policy",
      description: "How we handle your data",
      icon: FiShield,
    },
    {
      href: "/terms",
      label: "Terms of Service",
      description: "Rules and guidelines",
      icon: FiFileText,
    }
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 flex flex-col md:flex-row items-center gap-6"
          >
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <FiUser className="text-4xl text-gray-400" />
              )}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-black dark:text-white mb-1">{session?.user?.name || "User"}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{session?.user?.email}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                {session?.user?.role === "admin" ? "Administrator" : "Standard Account"}
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto mt-4 md:mt-0">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Appearance</span>
              <ThemeToggle />
            </div>
          </motion.div>

          {/* Menu Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid sm:grid-cols-2 gap-4"
          >
            {menuItems.map((item, i) => (
              <Link key={i} href={item.href}>
                <div className="glass-card glass-card-hover p-5 h-full flex items-start gap-4 transition-all cursor-pointer">
                  <div className="p-3 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
                    <item.icon className="text-xl text-black dark:text-white" />
                  </div>
                  <div>
                    <h3 className="text-black dark:text-white font-semibold mb-1">{item.label}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{item.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>

          {/* Danger Zone */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 border-red-200 dark:border-red-500/20"
          >
            <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
              <FiAlertTriangle className="text-lg" /> Danger Zone
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <FiLogOut /> Secure Logout
              </button>
              
              <button 
                onClick={() => setDeleteModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-500 font-medium hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                <FiTrash2 /> Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
      
      <DeleteAccountModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={handleDeleteConfirm}
        isGoogleUser={!!session?.user?.image}
      />
    </>
  );
}
