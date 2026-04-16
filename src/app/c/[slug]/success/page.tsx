"use client"

import { Suspense } from "react"
import { useSearchParams, useParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, DollarSign } from "lucide-react"

function SuccessContent() {
  const params = useParams()
  const slug = params.slug as string
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  return (
    <div className="min-h-screen bg-[#0b2518] text-zinc-100 selection:bg-green-500/30 flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
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

          <div className="space-y-3">
            {/* Claim Payout — main CTA */}
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
        </div>

        {/* Info card */}
        <div className="rounded-xl border border-green-400/[0.08] bg-green-400/[0.03] p-5 text-left">
          <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">How to get paid</h3>
          <ol className="space-y-2 text-xs text-zinc-400">
            <li className="flex gap-2">
              <span className="text-green-400 font-bold shrink-0">1.</span>
              Log in to your dashboard using the button above
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
