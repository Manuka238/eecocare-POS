"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { useThemeMode } from "@/components/theme-provider";
import { ThemeSwitch } from "@/components/ui";

let hasCheckedSplash = false;

export default function LoginPage() {
  const router = useRouter();
  const { dark } = useThemeMode();



  useEffect(() => {
    // Redirect authenticated sessions immediately
    const loggedIn = localStorage.getItem("eeco-pos-logged-in") === "true";
    if (loggedIn) {
      const { getFirstAllowedPage } = require("@/lib/permissions");
      router.push(getFirstAllowedPage());
      return;
    }

    // React StrictMode double-mounting safeguard in dev environments
    if (hasCheckedSplash) return;

    // Force F5 refreshes or direct URL hits back to cinematic splash screen (/)
    const fromSplash = sessionStorage.getItem("splash-completed") === "true";
    if (!fromSplash) {
      router.push("/");
    } else {
      hasCheckedSplash = true;
      sessionStorage.removeItem("splash-completed");
    }
  }, [router]);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || success) return;

    setLoading(true);
    setError(false);

    // Dynamic 1.2s delay for professional processing effect
    setTimeout(() => {
      let matchedUser = null;

      const storedUsers = localStorage.getItem("system_users");
      if (storedUsers) {
        try {
          const users = JSON.parse(storedUsers);
          const uInput = username.trim().toLowerCase();
          matchedUser = users.find((u: any) => 
            (u.username && u.username.toLowerCase() === uInput) ||
            u.email.toLowerCase() === uInput || 
            (u.shortName && u.shortName.toLowerCase() === uInput)
          );
        } catch (e) {
          console.error("Failed to parse system_users in login", e);
        }
      }

      if (username.trim().toLowerCase() === "sampath123" && password === "Mapi1990") {
        setSuccess(true);
        localStorage.setItem("eeco-pos-logged-in-email", "admin@crh.com");
        localStorage.setItem("eeco-pos-logged-in", "true");
        
        // Staggered delay for successful enter feedback
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else if (matchedUser && matchedUser.status === "Active" && password === (matchedUser.password || "password123")) {
        setSuccess(true);
        localStorage.setItem("eeco-pos-logged-in-email", matchedUser.email);
        localStorage.setItem("eeco-pos-logged-in", "true");
        
        // Staggered delay for successful enter feedback
        setTimeout(() => {
          const { getFirstAllowedPage } = require("@/lib/permissions");
          router.push(getFirstAllowedPage());
        }, 1200);
      } else {
        setError(true);
        setLoading(false);
        // Clear password on error
        setPassword("");
      }
    }, 1200);
  };

  return (
    <div className={`relative min-h-screen w-full flex items-center justify-center p-4 md:p-6 transition-colors duration-500 overflow-hidden ${dark ? "bg-[#03060E] text-white" : "bg-slate-50 text-slate-900"}`}>
      
      {/* ── AMBIENT FLOATING BLUR ORBS ── */}
      <motion.div 
        animate={{ 
          x: [0, 40, -20, 0],
          y: [0, -30, 50, 0],
        }}
        transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
        className="absolute top-1/6 left-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          x: [0, -50, 30, 0],
          y: [0, 40, -40, 0],
        }}
        transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
        className="absolute bottom-1/6 right-1/4 w-[380px] h-[380px] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" 
      />

      {/* Grid overlay */}
      <div 
        className={`absolute inset-0 opacity-[0.02] pointer-events-none ${dark ? "border-white" : "border-black"}`}
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: "45px 45px"
        }}
      />

      {/* ── CENTRAL BACKGROUND LOGO WATERMARK ── */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none z-0">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 1.5, -1.5, 0]
          }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "easeInOut"
          }}
          className="w-[75vmin] h-[75vmin] max-w-[600px] max-h-[600px] opacity-[0.02] dark:opacity-[0.035] grayscale"
        >
          <img src="/logo.png" alt="EECO GROUP Watermark" className="w-full h-full object-contain" />
        </motion.div>
      </div>

      {/* Theme switcher floating on login screen */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeSwitch 
          className={dark ? "bg-white/10 border-none" : "bg-slate-200 border-none"}
          circleClassName={dark ? "bg-white text-slate-900" : "bg-violet-600 text-white"}
        />
      </div>

      {/* ── LOGIN FORM CARD ── */}
      <motion.div
        animate={{ 
          x: error ? [-12, 12, -12, 12, -6, 6, 0] : 0,
          scale: success ? 0.95 : 1
        }}
        transition={{ 
          x: { duration: 0.5, ease: "easeInOut" },
          scale: { duration: 0.3 }
        }}
        className={`relative w-full max-w-[440px] rounded-[32px] border p-8 md:p-10 shadow-2xl overflow-hidden backdrop-blur-xl ${dark ? "bg-slate-950/75 border-white/10 text-white shadow-black/40" : "bg-white/80 border-slate-250/50 text-slate-800 shadow-slate-350/20"}`}
      >
        {/* Border accent lines */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500" />
        
        {/* Header Block */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className={`h-16 w-16 rounded-2xl p-1.5 flex items-center justify-center shadow-lg border mb-4 bg-white ${dark ? "border-white/10 shadow-blue-500/10" : "border-slate-200 shadow-slate-200/50"}`}>
            <img src="/logo.png" alt="EECO GROUP Logo" className="h-full w-full object-contain" />
          </div>
          <h2 className="text-2xl font-black tracking-tight leading-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500">
            EECO GROUP
          </h2>
          <p className={`text-xs mt-1.5 font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>
            POS CONTROL WORKSPACE 1.0
          </p>
        </div>

        {/* ── AUTH STATUS VIEWER ── */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-5 rounded-2xl bg-rose-500/15 border border-rose-500/20 p-3.5 text-center text-xs text-rose-500 font-semibold flex items-center gap-2.5"
            >
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span className="text-left leading-normal">Access Denied: Invalid credentials entered.</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-[#03060E]/95 backdrop-blur-lg z-30 flex flex-col items-center justify-center p-6 text-center text-white"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="h-16 w-16 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-4"
              >
                <ShieldCheck className="h-9 w-9" />
              </motion.div>
              <h3 className="text-xl font-bold">Secure Link Verified!</h3>
              <p className="text-xs text-slate-400 mt-2 tracking-wide font-medium">Welcome back. Redirecting to hub dashboard...</p>
              <div className="mt-8 flex h-1.5 w-32 rounded-full bg-white/5 overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.0 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className={`block text-[11px] font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Workspace Username
            </label>
            <div className="relative group">
              <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500 group-focus-within:text-violet-500" : "text-slate-400 group-focus-within:text-violet-600"} transition-colors`}>
                <User className="h-4.5 w-4.5" />
              </div>
              <input
                type="text"
                required
                className={`w-full rounded-2xl border pl-11 pr-4 py-3 text-sm outline-none transition-all ${dark ? "border-white/10 bg-slate-900/60 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20" : "border-slate-200 bg-slate-50/60 text-slate-800 placeholder:text-slate-450 focus:border-violet-600 focus:ring-1 focus:ring-violet-600/10"}`}
                placeholder="Enter username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Access Password
              </label>
              <button 
                type="button"
                className="text-[10px] font-bold text-violet-500 hover:text-violet-600 dark:text-violet-400 hover:dark:text-violet-300 uppercase tracking-wider transition-colors"
                tabIndex={-1}
              >
                Forgot?
              </button>
            </div>
            <div className="relative group">
              <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500 group-focus-within:text-violet-500" : "text-slate-400 group-focus-within:text-violet-600"} transition-colors`}>
                <Lock className="h-4.5 w-4.5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className={`w-full rounded-2xl border pl-11 pr-11 py-3 text-sm outline-none transition-all ${dark ? "border-white/10 bg-slate-900/60 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20" : "border-slate-200 bg-slate-50/60 text-slate-800 placeholder:text-slate-450 focus:border-violet-600 focus:ring-1 focus:ring-violet-600/10"}`}
                placeholder="Enter workspace key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 hover:scale-105 active:scale-95 transition ${dark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Remember option */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-slate-350 dark:border-white/10 bg-transparent text-violet-600 focus:ring-violet-500 h-4.2 w-4.2 cursor-pointer"
              />
              <span className={dark ? "text-slate-400" : "text-slate-500"}>Remember session</span>
            </label>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading || success}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-xl shadow-blue-500/15 hover:shadow-2xl transition hover:brightness-110 active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Verifying Access...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>Sign In Workspace</span>
                <ArrowRight className="h-4.5 w-4.5 shrink-0" />
              </>
            )}
          </button>
        </form>

        {/* Dynamic Sandbox Disclaimer Footer */}
        <div className={`mt-8 pt-6 border-t text-center text-[10px] font-bold uppercase tracking-wider ${dark ? "border-white/5 text-slate-500" : "border-slate-100 text-slate-400"}`}>
          🔒 EECO GROUP Control Sandbox
        </div>
      </motion.div>
    </div>
  );
}
