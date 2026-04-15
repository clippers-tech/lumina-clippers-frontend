"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function LegacySubmissionsRedirect() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-lime-500/30 flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-lime-400/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-sm mx-auto px-4 text-center">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          <h1 className="text-lg font-extrabold text-zinc-100 mb-2">Dashboard Moved</h1>
          <p className="text-sm text-zinc-400 mb-6">
            The submissions dashboard has moved to a new location. Please login to access your dashboard.
          </p>
          <Link
            href="/viral"
            className="block w-full bg-lime-400 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(163,230,53,0.4)] hover:bg-lime-300 transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
