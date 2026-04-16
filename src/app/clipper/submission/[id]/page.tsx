"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Upload, DollarSign, RotateCcw,
  AlertCircle, CheckCircle2, ShieldCheck, Clock, ExternalLink,
} from "lucide-react"
import {
  clipperApi, verification,
  type ClipperDashboard, type ClipperSubmission,
} from "@/lib/api"
import { getClipperToken, clearClipperToken } from "@/lib/clipper-auth"
import { formatNumber, formatCurrency, platformIcon } from "@/lib/utils"
import { ClipperNav } from "@/components/clipper/ClipperNav"
import { AtmosphericBackground } from "@/components/layout/AtmosphericBackground"
import { useToast } from "@/components/ui/toast"

/* ── Embed helpers ──────────────────────────────────────── */
function getEmbedUrl(platform: string, url: string): string | null {
  if (platform === "youtube") {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)
    if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`
  }
  if (platform === "tiktok") {
    const m = url.match(/\/video\/(\d+)/)
    if (m) return `https://www.tiktok.com/embed/v2/${m[1]}`
  }
  if (platform === "instagram") {
    const m = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/)
    if (m) return `https://www.instagram.com/reel/${m[1]}/embed/`
  }
  if (platform === "twitter") {
    const m = url.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/)
    if (m) return `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}&theme=dark`
  }
  return null
}

function getEmbedHeight(platform: string): string {
  if (platform === "tiktok") return "500px"
  if (platform === "youtube") return "315px"
  if (platform === "instagram") return "450px"
  if (platform === "twitter") return "350px"
  return "400px"
}

/* ── Proof Upload ───────────────────────────────────────── */
function ProofUpload({
  submissionId, submissionToken, isReupload, onComplete,
}: {
  submissionId: number; submissionToken: string; isReupload?: boolean; onComplete: () => void
}) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("video/")) { toast({ description: "Please select a video file", variant: "error" }); return }
    if (file.size > 100 * 1024 * 1024) { toast({ description: "File must be under 100MB", variant: "error" }); return }
    setUploading(true); setProgress(0)
    try {
      await verification.upload(submissionToken, submissionId, file, setProgress)
      toast({ description: isReupload ? "New proof uploaded" : "Proof uploaded successfully", variant: "success" })
      onComplete()
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Upload failed", variant: "error" })
    } finally { setUploading(false); setProgress(0) }
  }

  if (uploading) {
    return (
      <div className="rounded-lg border border-green-400/[0.1] bg-green-400/[0.03] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Uploading proof...</span>
          <span className="text-[10px] text-zinc-400 font-mono">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full bg-green-400 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border-2 border-dashed border-white/[0.08] p-6 text-center cursor-pointer hover:border-green-400/20 transition-colors"
      onClick={() => {
        const input = document.createElement("input"); input.type = "file"; input.accept = "video/*"
        input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f) }
        input.click()
      }}
    >
      <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
      <p className="text-sm text-zinc-400">{isReupload ? "Drop new proof or " : "Drop your proof video or "}<span className="text-green-400 font-semibold">click to browse</span></p>
      <p className="text-[10px] text-zinc-600 mt-1">.mp4, .mov, .webm — max 100MB</p>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────── */
export default function SubmissionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const subId = Number(params.id)

  const [submission, setSubmission] = useState<ClipperSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)

  const loadData = useCallback(async () => {
    const token = getClipperToken()
    if (!token) { router.replace("/viral"); return }
    try {
      const data: ClipperDashboard = await clipperApi.dashboardAuth(token)
      const sub = data.submissions.find((s) => s.id === subId)
      if (!sub) { router.replace("/clipper/dashboard"); return }
      setSubmission(sub)
    } catch {
      clearClipperToken()
      router.replace("/viral")
    } finally { setLoading(false) }
  }, [router, subId])

  useEffect(() => { loadData() }, [loadData])

  if (loading || !submission) {
    return (
      <AtmosphericBackground>
        <ClipperNav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </AtmosphericBackground>
    )
  }

  const vs = submission.verification_status || "pending"
  const isPaid = submission.status === "paid"
  const isClaimed = submission.status === "payment_claimed"
  const isVerified = vs === "verified"
  const embedUrl = getEmbedUrl(submission.platform.toLowerCase(), submission.post_url)

  const handleClaim = async () => {
    const token = getClipperToken(); if (!token) return
    setClaiming(true)
    try {
      await clipperApi.claimPayment(token, submission.id)
      toast({ description: "Payment claimed.", variant: "success" })
      loadData()
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Claim failed", variant: "error" })
    } finally { setClaiming(false) }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })

  return (
    <AtmosphericBackground>
      <ClipperNav />
      <main className="max-w-4xl mx-auto px-4 py-6 pt-20 space-y-5">
        {/* Back link */}
        <Link href="/clipper/dashboard" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">Submission #{submission.id}</p>
            <h1 className="text-xl font-bold text-zinc-100">{submission.campaign_name}</h1>
            <a href={submission.post_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-green-400 transition-colors inline-flex items-center gap-1 mt-1">
              {submission.post_url} <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isVerified && !isPaid && !isClaimed && (
              <button onClick={handleClaim} disabled={claiming}
                className="flex items-center gap-1.5 bg-green-400 text-black font-bold text-xs px-4 py-2 rounded-lg uppercase tracking-wide shadow-[0_0_20px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50"
              >
                <DollarSign className="w-3.5 h-3.5" />
                {claiming ? "Claiming..." : "Claim Payment"}
              </button>
            )}
            {isPaid && (
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> Paid
              </span>
            )}
            {isClaimed && (
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5" /> Payment Pending
              </span>
            )}
          </div>
        </div>

        {/* Stats + Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Platform</span>
            <p className="text-sm font-bold text-zinc-100 mt-0.5 flex items-center gap-1.5">
              {platformIcon(submission.platform)} {submission.platform}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Views</span>
            <p className="text-sm font-bold text-zinc-100 mt-0.5">{formatNumber(submission.views)}</p>
          </div>
          <div className="rounded-xl border border-green-400/20 bg-green-400/[0.04] p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Est. Earnings</span>
            <p className="text-sm font-bold text-green-400 mt-0.5">{formatCurrency(submission.est_earnings)}</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Submitted</span>
            <p className="text-sm font-bold text-zinc-100 mt-0.5">{submission.created_at ? formatDate(submission.created_at) : "-"}</p>
          </div>
        </div>

        {/* Verification status bar */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Verification:</span>
            {vs === "pending" && <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400"><AlertCircle className="w-3.5 h-3.5" /> No proof uploaded</span>}
            {vs === "uploaded" && <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-400"><ShieldCheck className="w-3.5 h-3.5" /> Proof under review</span>}
            {vs === "verified" && <span className="inline-flex items-center gap-1 text-xs font-bold text-green-400"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>}
            {vs === "rejected" && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                <AlertCircle className="w-3.5 h-3.5" /> Rejected
                {submission.verification_note && <span className="text-zinc-500 font-normal"> — {submission.verification_note}</span>}
              </span>
            )}
          </div>
          {(vs === "uploaded" || vs === "verified") && !isPaid && !isClaimed && (
            <button onClick={() => {
              const input = document.createElement("input"); input.type = "file"; input.accept = "video/*"
              input.onchange = async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return
                try {
                  await verification.upload(submission.submission_token, submission.id, f, () => {})
                  toast({ description: "Re-uploaded proof", variant: "success" }); loadData()
                } catch { toast({ description: "Upload failed", variant: "error" }) }
              }; input.click()
            }}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Re-upload proof
            </button>
          )}
        </div>

        {/* Two-column: Embed + Proof */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Post embed */}
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Post</p>
            </div>
            {embedUrl ? (
              <div style={{ height: getEmbedHeight(submission.platform.toLowerCase()) }}>
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${submission.platform} embed`}
                />
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-zinc-500">Embed not available for this platform.</p>
                <a href={submission.post_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-green-400 hover:text-green-300 mt-2 inline-block">
                  View on {submission.platform} &rarr;
                </a>
              </div>
            )}
          </div>

          {/* Proof video */}
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Proof Video</p>
            </div>
            {submission.verification_video_url ? (
              <div className="p-4">
                <video
                  src={submission.verification_video_url}
                  controls
                  className="w-full rounded-lg max-h-[400px] bg-black"
                />
              </div>
            ) : (vs === "pending" || vs === "rejected") && !isPaid ? (
              <div className="p-4">
                <ProofUpload
                  submissionId={submission.id}
                  submissionToken={submission.submission_token}
                  isReupload={vs === "rejected"}
                  onComplete={loadData}
                />
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-zinc-500">No proof video uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </AtmosphericBackground>
  )
}
