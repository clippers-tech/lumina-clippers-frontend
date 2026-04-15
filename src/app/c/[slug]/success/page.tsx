"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { publicApi, type PublicSubmission } from "@/lib/api"
import { VerificationUpload } from "@/components/VerificationUpload"

function SuccessContent() {
  const params = useParams()
  const slug = params.slug as string
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const submissionToken = searchParams.get("token") || ""
  const [submission, setSubmission] = useState<PublicSubmission | null>(null)

  useEffect(() => {
    if (!submissionToken) return
    publicApi.clipperSubmissions(submissionToken)
      .then((subs) => {
        if (subs.length > 0) {
          // Most recent submission is the one just created
          const sorted = [...subs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          setSubmission(sorted[0])
        }
      })
      .catch(() => {})
  }, [submissionToken])

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-lime-500/30 flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-lime-400/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 text-center space-y-6">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-8">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-lime-400/10 mb-6">
            <CheckCircle className="w-8 h-8 text-lime-400" />
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
            <Link
              href="/viral"
              className="block w-full bg-lime-400 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(163,230,53,0.4)] hover:bg-lime-300 transition-all"
            >
              Go to Dashboard
            </Link>
            <Link
              href={`/c/${slug}`}
              className="block w-full border border-white/[0.06] bg-transparent text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] transition-all"
            >
              Submit Another Clip
            </Link>
          </div>
        </div>

        {/* Verification Upload */}
        {submission && submissionToken && (
          <div className="text-left">
            <VerificationUpload
              submissionId={submission.id}
              token={submissionToken}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
