"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { clipperAuth } from "@/lib/api"
import { LuminaLogo } from "@/components/LuminaLogo"
import { setClipperToken } from "@/lib/clipper-auth"
import { useToast } from "@/components/ui/toast"
import { Lock, ArrowLeft } from "lucide-react"

export default function ViralLoginPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Set-password flow state
  const [needsPassword, setNeedsPassword] = useState(false)
  const [lockedEmail, setLockedEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [settingPw, setSettingPw] = useState(false)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await clipperAuth.login(email, password)

      if (result.status === "password_not_set") {
        // Clipper exists but hasn't set a password yet
        setLockedEmail(result.email || email)
        setNeedsPassword(true)
        return
      }

      // Normal login success
      if (result.access_token) {
        setClipperToken(result.access_token)
        toast({ description: "Login successful!", variant: "success" })
        router.push("/clipper/dashboard")
      }
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : "Login failed",
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast({ description: "Password must be at least 8 characters", variant: "error" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ description: "Passwords do not match", variant: "error" })
      return
    }
    setSettingPw(true)
    try {
      const result = await clipperAuth.setPassword(lockedEmail, newPassword)
      if (result.access_token) {
        setClipperToken(result.access_token)
        toast({ description: "Password set! You're logged in.", variant: "success" })
        router.push("/clipper/dashboard")
      }
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : "Failed to set password",
        variant: "error",
      })
    } finally {
      setSettingPw(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b2518] text-zinc-100 selection:bg-green-500/30 flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-400/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <LuminaLogo size={48} />
          </div>
          <h1 className="text-xl font-extrabold text-zinc-100">
            {needsPassword ? "Create Your Password" : "Creator Login"}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {needsPassword
              ? "Set a password to access your dashboard"
              : "Sign in to your clipper dashboard"
            }
          </p>
        </div>

        {/* Set Password Form */}
        {needsPassword ? (
          <div className="rounded-xl border border-green-400/20 bg-gradient-to-b from-green-400/[0.06] to-transparent backdrop-blur-[2px] p-6">
            {/* Locked email display */}
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 py-2.5 mb-5">
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-sm text-zinc-300">{lockedEmail}</span>
            </div>

            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 placeholder:text-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Type password again"
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 placeholder:text-zinc-600 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={settingPw}
                className="w-full bg-green-400 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-40"
              >
                {settingPw ? "Setting password..." : "Set Password & Sign In"}
              </button>
            </form>

            <button
              onClick={() => { setNeedsPassword(false); setNewPassword(""); setConfirmPassword("") }}
              className="flex items-center gap-1 mx-auto mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back to login
            </button>
          </div>
        ) : (
          /* Normal Login Form */
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-6">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 placeholder:text-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 placeholder:text-zinc-600 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-400 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-40"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        )}

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            &larr; Back to Campaigns
          </Link>
        </div>
      </div>
    </div>
  )
}
