"use client";

import { useState, useRef, useCallback, type ChangeEvent, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiUsers, FiFileText, FiClock, FiEdit3, FiUploadCloud, FiX, FiLoader, FiShield, FiAlertTriangle } from "react-icons/fi";

interface FormData {
  username: string;
  followers: string;
  posts: string;
  accountAge: string;
  bio: string;
  profileImage: string;
}

interface ProfileFormProps {
  onResult: (result: unknown) => void;
}

const initial: FormData = { username: "", followers: "", posts: "", accountAge: "", bio: "", profileImage: "" };

export default function ProfileForm({ onResult }: ProfileFormProps) {
  const [form, setForm] = useState<FormData>(initial);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }, []);

  const handleImage = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { const s = r.result as string; setForm((p) => ({ ...p, profileImage: s })); setPreview(s); };
    r.readAsDataURL(f);
  }, []);

  const removeImage = useCallback(() => {
    setForm((p) => ({ ...p, profileImage: "" })); setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault(); setErrors([]); setLoading(true);
    try {
      const res = await fetch("/api/submitProfile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, followers: Number(form.followers) || 0, posts: Number(form.posts) || 0, accountAge: form.accountAge, bio: form.bio, profileImage: form.profileImage || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors(data.errors || [data.message]); setLoading(false); return; }
      onResult(data.verification);
    } catch { setErrors(["Network error"]); } finally { setLoading(false); }
  }, [form, onResult]);

  const ic = "w-full bg-gray-100 dark:bg-zinc-900/60 border border-gray-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-black dark:text-white placeholder:text-gray-500 dark:text-gray-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all text-sm";

  return (
    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 w-full max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-lg bg-brand-600/20 border border-gray-300 dark:border-zinc-800"><FiShield className="text-brand-700 dark:text-brand-400 text-xl" /></div>
        <div><h2 className="text-xl font-bold text-black dark:text-white">Profile Analysis</h2><p className="text-xs text-gray-500 dark:text-gray-400">Enter profile data to verify</p></div>
      </div>

      <AnimatePresence>{errors.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-cyber-red/10 border border-cyber-red/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-cyber-red text-sm font-medium mb-1"><FiAlertTriangle /> Validation Errors</div>
          <ul className="list-disc list-inside text-xs text-red-300 space-y-0.5">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
        </motion.div>
      )}</AnimatePresence>

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"><FiUser className="text-brand-700 dark:text-brand-400" /> Username <span className="text-cyber-red">*</span></label>
        <input type="text" name="username" value={form.username} onChange={handleChange} placeholder="e.g. john_doe_2024" className={ic} required id="input-username" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"><FiUsers className="text-brand-700 dark:text-brand-400" /> Followers</label>
          <input type="number" name="followers" value={form.followers} onChange={handleChange} placeholder="0" min={0} className={ic} id="input-followers" />
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"><FiFileText className="text-brand-700 dark:text-brand-400" /> Posts</label>
          <input type="number" name="posts" value={form.posts} onChange={handleChange} placeholder="0" min={0} className={ic} id="input-posts" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"><FiClock className="text-brand-700 dark:text-brand-400" /> Account Age</label>
        <input type="text" name="accountAge" value={form.accountAge} onChange={handleChange} placeholder="e.g. 3 days, 2 months" className={ic} required id="input-account-age" />
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"><FiEdit3 className="text-brand-700 dark:text-brand-400" /> Bio</label>
        <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Profile bio text" rows={3} className={`${ic} resize-none`} id="input-bio" />
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"><FiUploadCloud className="text-brand-700 dark:text-brand-400" /> Profile Image</label>
        {preview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-24 h-24 rounded-xl object-cover border-2 border-gray-300 dark:border-zinc-800" />
            <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-cyber-red flex items-center justify-center text-white text-xs cursor-pointer"><FiX /></button>
          </div>
        ) : (
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-zinc-800 rounded-xl p-6 text-center cursor-pointer hover:border-brand-400/40 transition-colors">
            <FiUploadCloud className="mx-auto text-3xl text-gray-500 dark:text-gray-400 mb-2" /><p className="text-xs text-gray-500 dark:text-gray-400">Click to upload</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" id="input-image" />
      </div>

      <motion.button type="submit" disabled={loading} whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.98 } : {}} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-black dark:text-white font-semibold text-sm shadow-lg shadow-brand-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
        {loading ? <><FiLoader className="animate-spin" /> Analyzing…</> : <><FiShield /> Analyze Profile</>}
      </motion.button>
    </motion.form>
  );
}
