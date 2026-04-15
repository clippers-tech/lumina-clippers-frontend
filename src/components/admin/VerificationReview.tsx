"use client"

import { useEffect, useState } from "react"
import { verification, type VerificationStatus } from "@/lib/api"
import { VerificationBadge } from "./VerificationBadge"
import { getToken } from "@/lib/auth"
import { useToast } from "@/components/ui/toast"
import { FileVideo, ShieldCheck, X, Loader2 } from "lucide-react"

interface VerificationReviewProps {
  submissionId: number
  initialVerificationStatus?: string | null
  initialVerificationNote?: string | null
  onVerified?: (status: string) => void
}

export function VerificationReview({
  submissionId,
  initialVerificationStatus,
  initialVerificationNote,
  onVerified,
}: VerificationReviewProps) {
  const { toast } = useToast()
  const [vStatus, setVStatus] = useState<VerificationStatus | null>(
    initialVerificationStatus != null
      ? { status: initialVerificationStatus, note: initialVerificationNote ?? null, has_video: initialVerificationStatus !== "pending" }
      : null
  )
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(!initialVerificationStatus)

  // Load verification status if not provided
  useEffect(() => {
    if (initialVerificationStatus != null) return
    const token = getToken()
    if (!token) return
    verification.status(token, submissionId)
      .then(setVStatus)
      .catch(() => setVStatus({ status: "pending", note: null, has_video: false }))
      .finally(() => setLoadingStatus(false))
  }, [submissionId, initialVerificationStatus])

  // Load video when status indicates one exists
  useEffect(() => {
    if (!vStatus?.has_video) return
    const token = getToken()
    if (!token) return
    setLoadingVideo(true)
    verification.video(token, submissionId)
      .then((res) => setVideoUrl(res.url))
      .catch(() => {})
      .finally(() => setLoadingVideo(false))
  }, [submissionId, vStatus?.has_video])

  const handleVerify = async (decision: "verified" | "rejected") => {
    setSubmitting(true)
    try {
      const token = getToken()!
      await verification.verify(token, submissionId, { status: decision, note: note || undefined })
      setVStatus((prev) => prev ? { ...prev, status: decision, note: note || null } : prev)
      toast({
        description: decision === "verified" ? "Submission verified" : "Submission rejected",
        variant: decision === "verified" ? "success" : "error",
      })
      onVerified?.(decision)
    } catch (err) {
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : "Failed to update verification",
        variant: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingStatus) {
    return (
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
          <span className="text-xs text-zinc-500">Loading verification status...</span>
        </div>
      </div>
    )
  }

  const currentStatus = vStatus?.status || "pending"
  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block"
  const inputClass = "w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30"

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Verification</h3>
        </div>
        <VerificationBadge status={currentStatus} />
      </div>

      {/* No video state */}
      {currentStatus === "pending" && (
        <div className="text-center py-6">
          <FileVideo className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No verification video uploaded yet</p>
        </div>
      )}

      {/* Video player */}
      {vStatus?.has_video && (
        <div className="mb-4">
          {loadingVideo ? (
            <div className="flex items-center justify-center py-12 rounded-lg bg-black/30">
              <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
            </div>
          ) : videoUrl ? (
            <video
              src={videoUrl}
              controls
              className="w-full rounded-lg bg-black"
              style={{ maxHeight: "400px" }}
            />
          ) : (
            <div className="flex items-center justify-center py-12 rounded-lg bg-black/30">
              <p className="text-xs text-zinc-500">Could not load video</p>
            </div>
          )}
        </div>
      )}

      {/* Admin note for verified/rejected */}
      {(currentStatus === "verified" || currentStatus === "rejected") && vStatus?.note && (
        <div className={`rounded-lg border px-4 py-3 mb-4 ${
          currentStatus === "verified"
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-red-500/20 bg-red-500/5"
        }`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
            currentStatus === "verified" ? "text-emerald-400" : "text-red-400"
          }`}>
            Admin Note
          </p>
          <p className={`text-xs ${
            currentStatus === "verified" ? "text-emerald-400/80" : "text-red-400/80"
          }`}>
            {vStatus.note}
          </p>
        </div>
      )}

      {/* Verify/Reject controls — show when video is uploaded */}
      {currentStatus === "uploaded" && (
        <div className="space-y-4 border-t border-white/[0.04] pt-4">
          <div>
            <label className={labelClass}>Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note about this verification..."
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleVerify("verified")}
              disabled={submitting}
              className="flex-1 h-10 bg-green-400 text-black font-extrabold text-xs px-6 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? "..." : "Verify"}
            </button>
            <button
              onClick={() => handleVerify("rejected")}
              disabled={submitting}
              className="flex-1 h-10 bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              {submitting ? "..." : "Reject"}
            </button>
          </div>
        </div>
      )}

      {/* Allow re-review for already decided */}
      {(currentStatus === "verified" || currentStatus === "rejected") && vStatus?.has_video && (
        <div className="border-t border-white/[0.04] pt-4 mt-4 space-y-4">
          <div>
            <label className={labelClass}>Update Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Update note..."
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="flex gap-3">
            {currentStatus === "rejected" && (
              <button
                onClick={() => handleVerify("verified")}
                disabled={submitting}
                className="flex-1 h-10 bg-green-400 text-black font-extrabold text-xs px-6 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                {submitting ? "..." : "Verify Instead"}
              </button>
            )}
            {currentStatus === "verified" && (
              <button
                onClick={() => handleVerify("rejected")}
                disabled={submitting}
                className="flex-1 h-10 bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                {submitting ? "..." : "Reject Instead"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
