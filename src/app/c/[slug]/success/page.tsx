"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, DollarSign, Lock, Eye, EyeOff } from "lucide-react"
import { clipperAuth } from "@/lib/api"
import { setClipperToken } from "@/lib/clipper-auth"
import { useToast } from "@/components/ui/toast"

function SuccessContent() {
  const params = useParams()
  const slug = params.slug as string
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const router = useRouter()
  const { toast } = useToast()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [settingPw, setSettingPw] = useState(false)
  const [passwordSet, setPasswordSet] = useState(false)

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
      const result = await clipperAuth.setPassword(email, newPassword)
      if (result.access_token) {
        setClipperToken(result.access_token)
        setPasswordSet(true)
        toast({ description: "Password set! You can now access your dashboard.", variant: "success" })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to set password"
      if (msg.includes("already set")) {
        // Already has a password — that's fine, just guide them to login
        setPasswordSet(true)
        toast({ description: "You already have a password. Sign in to your dashboard.", variant: "success" })
      } else {
        toast({ description: msg, variant: "error" })
      }
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-400/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 text-center space-y-6">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-8">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-400/10 mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>

          <h1 className="text-2xl font-extrabold text-zinc-100 mb-2">Submission Received!</h1>
          <p className="text-sm text-zinc-400 mb-6">
            Your clip has been submitted successfully. We&apos;ll start tracking views automatically.
          </p>

          {email && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Submitted as</span>
              <span className="text-sm text-zinc-200 font-semibold">{email}</span>
            </div>
          )}

          {/* Password set success → go to dashboard */}
          {passwordSet ? (
            <div className="space-y-3">
              <button
                onClick={() => router.push("/clipper/dashboard")}
                className="flex items-center justify-center gap-2 w-full bg-green-400 text-black font-extrabold text-sm px-6 py-3.5 rounded-lg uppercase tracking-wide shadow-[0_0_30px_-5px_rgba(74,222,128,0.5)] hover:bg-green-300 transition-all"
              >
                <DollarSign className="w-5 h-5" />
                Go to Dashboard
              </button>
              <Link
                href={`/c/${slug}`}
                className="block w-full border border-white/[0.06] bg-transparent text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] transition-all"
              >
                Submit Another Clip
              </Link>
            </div>
          ) : email ? (
            /* Set Password Form */
            <div className="text-left">
              <div className="rounded-lg border border-green-400/15 bg-green-400/[0.05] px-4 py-3 mb-4">
                <p className="text-xs text-zinc-300">
                  <span className="text-green-400 font-bold">Create a password</span> to track your clips, upload proof videos, and claim payouts.
                </p>
              </div>

              <form onSubmit={handleSetPassword} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-green-400/30 placeholder:text-zinc-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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
                  className="flex items-center justify-center gap-2 w-full bg-green-400 text-black font-extrabold text-sm px-6 py-3 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-40"
                >
                  <Lock className="w-4 h-4" />
                  {settingPw ? "Setting up..." : "Create Account to Claim Payout"}
                </button>
              </form>

              <div className="flex items-center gap-3 mt-4">
                <Link
                  href={`/c/${slug}`}
                  className="flex-1 text-center border border-white/[0.06] bg-transparent text-zinc-400 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-white/[0.05] transition-all"
                >
                  Skip for now
                </Link>
                <Link
                  href="/viral"
                  className="flex-1 text-center border border-white/[0.06] bg-transparent text-zinc-400 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-white/[0.05] transition-all"
                >
                  I already have a password
                </Link>
              </div>
            </div>
          ) : (
            /* No email in URL — fallback links */
            <div className="space-y-3">
              <Link
                href="/viral"
                className="flex items-center justify-center gap-2 w-full bg-green-400 text-black font-extrabold text-sm px-6 py-3.5 rounded-lg uppercase tracking-wide shadow-[0_0_30px_-5px_rgba(74,222,128,0.5)] hover:bg-green-300 transition-all"
              >
                <DollarSign className="w-5 h-5" />
                Claim Payout
              </Link>
              <Link
                href={`/c/${slug}`}
                className="block w-full border border-white/[0.06] bg-transparent text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] transition-all"
              >
                Submit Another Clip
              </Link>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="rounded-xl border border-green-400/[0.08] bg-green-400/[0.03] p-5 text-left">
          <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">How to get paid</h3>
          <ol className="space-y-2 text-xs text-zinc-400">
            <li className="flex gap-2">
              <span className="text-green-400 font-bold shrink-0">1.</span>
              Log in to your dashboard to see your submissions
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 font-bold shrink-0">2.</span>
              Upload a proof video (screen recording of your analytics showing the view count)
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 font-bold shrink-0">3.</span>
              Once verified, click &quot;Claim Payment&quot; and you&apos;ll be paid based on your verified views
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b2518] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
