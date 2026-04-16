"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, ChevronDown, MessageSquare, DollarSign, ShieldCheck, AlertCircle, RotateCcw, CheckCircle2, Wallet, LayoutGrid, List } from "lucide-react"
import { clipperApi, clipperAuth, verification, type ClipperDashboard, type ClipperSubmission, type ClipperCampaignOption, type ClipperBulkSubmitResult } from "@/lib/api"
import { getClipperToken, clearClipperToken } from "@/lib/clipper-auth"
import { formatNumber, formatCurrency, platformIcon, statusColor } from "@/lib/utils"
import { ClipperNav } from "@/components/clipper/ClipperNav"
import { useToast } from "@/components/ui/toast"

/* ── Stat Card ────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${
      accent
        ? "border-green-400/20 bg-gradient-to-br from-green-400/[0.08] to-green-400/[0.02]"
        : "border-white/[0.08] bg-[#0d3420]/80"
    }`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
      <p className={`text-xl font-extrabold mt-1 ${accent ? "text-green-400" : "text-zinc-100"}`}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  )
}

/* ── Collapsible Section ─────────────────────────────── */
function CollapsibleSection({ title, icon, children, defaultOpen = false, count }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; count?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d3420]/80 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-bold text-zinc-200">{title}</span>
          {count !== undefined && (
            <span className="text-[10px] font-bold text-zinc-500 bg-white/[0.06] px-1.5 py-0.5 rounded">{count}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-4 border-t border-white/[0.06]">{children}</div>}
    </div>
  )
}

/* PayoutGuideBanner removed — replaced by CollapsibleSection inline */

/* ── Proof Upload Inline ──────────────────────────────── */
function ProofUploadInline({
  submissionId,
  submissionToken,
  isReupload,
  onComplete,
}: {
  submissionId: number
  submissionToken: string
  isReupload?: boolean
  onComplete: () => void
}) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast({ description: "Please select a video file", variant: "error" })
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      toast({ description: "File must be under 100MB", variant: "error" })
      return
    }
    setUploading(true)
    setProgress(0)
    try {
      await verification.upload(submissionToken, submissionId, file, setProgress)
      toast({ description: isReupload ? "New proof video uploaded" : "Proof video uploaded successfully", variant: "success" })
      onComplete()
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Upload failed", variant: "error" })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="mt-3">
      {uploading ? (
        <div className="rounded-lg border border-green-400/[0.1] bg-green-400/[0.03] p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Uploading proof...</span>
            <span className="text-[10px] text-zinc-400 font-mono">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-green-400 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${
            dragOver ? "border-green-400/40 bg-green-400/[0.05]" : "border-white/[0.08] hover:border-green-400/20"
          }`}
          onClick={() => {
            const input = document.createElement("input")
            input.type = "file"
            input.accept = "video/*"
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (file) handleFile(file)
            }
            input.click()
          }}
        >
          <Upload className="w-5 h-5 text-zinc-500 mx-auto mb-1" />
          <p className="text-xs text-zinc-400">
            {isReupload ? "Drop new proof video or " : "Drop your proof video or "}
            <span className="text-green-400 font-semibold">click to browse</span>
          </p>
          <p className="text-[10px] text-zinc-600 mt-0.5">.mp4, .mov, .webm — max 100MB</p>
        </div>
      )}
    </div>
  )
}

/* ── Submission Card ──────────────────────────────────── */
function SubmissionCard({
  submission,
  token,
  onRefresh,
}: {
  submission: ClipperSubmission
  token: string
  onRefresh: () => void
}) {
  const { toast } = useToast()
  const [showUpload, setShowUpload] = useState(false)
  const [claiming, setClaiming] = useState(false)

  const vs = submission.verification_status || "pending"
  const isPaid = submission.status === "paid"
  const isClaimed = submission.status === "payment_claimed"
  const isVerified = vs === "verified"
  const hasProof = vs === "uploaded" || vs === "verified" || vs === "rejected"

  const handleClaimPayment = async () => {
    setClaiming(true)
    try {
      await clipperApi.claimPayment(token, submission.id)
      toast({ description: "Payment claimed. You'll be paid shortly.", variant: "success" })
      onRefresh()
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Claim failed", variant: "error" })
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d3420]/80 p-4">
      {/* Top row: platform + campaign + status */}
      <div className="flex items-center gap-3 mb-3">
        {submission.thumbnail_url ? (
          <img src={submission.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-white/[0.05] shrink-0 flex items-center justify-center text-lg">
            {platformIcon(submission.platform)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-zinc-200 truncate">{submission.campaign_name}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/[0.05] text-zinc-300 border border-white/[0.06]">
              {platformIcon(submission.platform.toLowerCase())} {submission.platform}
            </span>
          </div>
          <a
            href={submission.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-zinc-500 hover:text-green-400 transition-colors truncate block"
          >
            {submission.post_url}
          </a>
        </div>

        <div className="text-right shrink-0 space-y-0.5">
          <p className="text-xs font-bold text-zinc-200">{formatNumber(submission.views)} views</p>
          <p className="text-xs text-green-400 font-semibold">{formatCurrency(submission.est_earnings)}</p>
        </div>
      </div>

      {/* Verification + Payment Status Bar */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.06]">
        {/* Left: verification status */}
        <div className="flex items-center gap-2">
          {vs === "pending" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              <AlertCircle className="w-3 h-3" /> No proof uploaded
            </span>
          )}
          {vs === "uploaded" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
              <ShieldCheck className="w-3 h-3" /> Proof under review
            </span>
          )}
          {vs === "verified" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
          {vs === "rejected" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
              <AlertCircle className="w-3 h-3" /> Proof rejected
              {submission.verification_note && (
                <span className="text-zinc-500 normal-case tracking-normal"> — {submission.verification_note}</span>
              )}
            </span>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Upload Proof - show for pending or rejected */}
          {(vs === "pending" || vs === "rejected") && !isPaid && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-1.5 bg-green-400 text-black font-bold text-[11px] px-3 py-1.5 rounded-lg uppercase tracking-wide hover:bg-green-300 transition-all shadow-[0_0_15px_-3px_rgba(74,222,128,0.3)]"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Proof
            </button>
          )}

          {/* Re-upload option for uploaded/verified */}
          {(vs === "uploaded" || vs === "verified") && !isPaid && !isClaimed && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Re-upload
            </button>
          )}

          {/* Claim Payment - only when verified and not yet claimed/paid */}
          {isVerified && !isPaid && !isClaimed && (
            <button
              onClick={handleClaimPayment}
              disabled={claiming}
              className="flex items-center gap-1.5 bg-green-400 text-black font-bold text-[11px] px-3 py-1.5 rounded-lg uppercase tracking-wide shadow-[0_0_20px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50"
            >
              <DollarSign className="w-3.5 h-3.5" />
              {claiming ? "Claiming..." : "Claim Payment"}
            </button>
          )}

          {/* Payment claimed badge */}
          {isClaimed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-lg">
              Payment Pending
            </span>
          )}

          {/* Paid badge */}
          {isPaid && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3 h-3" /> Paid
            </span>
          )}
        </div>
      </div>

      {/* Expandable upload area */}
      {showUpload && (
        <ProofUploadInline
          submissionId={submission.id}
          submissionToken={submission.submission_token}
          isReupload={hasProof}
          onComplete={() => {
            setShowUpload(false)
            onRefresh()
          }}
        />
      )}

      {/* Info note about views */}
      {vs === "pending" && !isPaid && (
        <p className="text-[10px] text-zinc-600 mt-2 italic">
          You will only be paid for the views shown in your analytics proof video.
        </p>
      )}
    </div>
  )
}

/* ── Submission Card — Grid ───────────────────────────── */
function SubmissionCardGrid({
  submission,
  token,
  onRefresh,
}: {
  submission: ClipperSubmission
  token: string
  onRefresh: () => void
}) {
  const { toast } = useToast()
  const [showUpload, setShowUpload] = useState(false)
  const [claiming, setClaiming] = useState(false)

  const vs = submission.verification_status || "pending"
  const isPaid = submission.status === "paid"
  const isClaimed = submission.status === "payment_claimed"
  const isVerified = vs === "verified"
  const hasProof = vs === "uploaded" || vs === "verified" || vs === "rejected"

  const handleClaimPayment = async () => {
    setClaiming(true)
    try {
      await clipperApi.claimPayment(token, submission.id)
      toast({ description: "Payment claimed.", variant: "success" })
      onRefresh()
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Claim failed", variant: "error" })
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d3420]/80 p-4 flex flex-col justify-between">
      {/* Top: campaign + platform */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-white/[0.05] shrink-0 flex items-center justify-center text-sm">
            {platformIcon(submission.platform)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-200 truncate">{submission.campaign_name}</p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{submission.platform}</span>
          </div>
        </div>
        <a
          href={submission.post_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-zinc-500 hover:text-green-400 transition-colors truncate block mt-1 mb-3"
        >
          {submission.post_url}
        </a>
      </div>

      {/* Middle: stats */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-lg font-extrabold text-zinc-100">{formatNumber(submission.views)}</p>
          <p className="text-[10px] text-zinc-500">views</p>
        </div>
        <p className="text-sm font-bold text-green-400">{formatCurrency(submission.est_earnings)}</p>
      </div>

      {/* Bottom: status + action */}
      <div className="pt-3 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between">
          {vs === "pending" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              <AlertCircle className="w-3 h-3" /> No proof
            </span>
          )}
          {vs === "uploaded" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
              <ShieldCheck className="w-3 h-3" /> Under review
            </span>
          )}
          {vs === "verified" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
          {vs === "rejected" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
              <AlertCircle className="w-3 h-3" /> Rejected
            </span>
          )}

          {/* Badges */}
          {isClaimed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
              Pending
            </span>
          )}
          {isPaid && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
              Paid
            </span>
          )}
        </div>

        {/* Actions */}
        {(vs === "pending" || vs === "rejected") && !isPaid && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="w-full flex items-center justify-center gap-1.5 bg-green-400 text-black font-bold text-[11px] px-3 py-1.5 rounded-lg uppercase tracking-wide hover:bg-green-300 transition-all shadow-[0_0_15px_-3px_rgba(74,222,128,0.3)]"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Proof
          </button>
        )}

        {isVerified && !isPaid && !isClaimed && (
          <button
            onClick={handleClaimPayment}
            disabled={claiming}
            className="w-full flex items-center justify-center gap-1.5 bg-green-400 text-black font-bold text-[11px] px-3 py-1.5 rounded-lg uppercase tracking-wide shadow-[0_0_20px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50"
          >
            <DollarSign className="w-3.5 h-3.5" />
            {claiming ? "Claiming..." : "Claim Payment"}
          </button>
        )}

        {(vs === "uploaded" || vs === "verified") && !isPaid && !isClaimed && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="w-full flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Re-upload
          </button>
        )}
      </div>

      {/* Upload area */}
      {showUpload && (
        <ProofUploadInline
          submissionId={submission.id}
          submissionToken={submission.submission_token}
          isReupload={hasProof}
          onComplete={() => {
            setShowUpload(false)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}

/* ── Bulk Upload Section ──────────────────────────────── */
function BulkUploadSection({
  token,
  campaigns,
  onUploadComplete,
}: {
  token: string
  campaigns: ClipperCampaignOption[]
  onUploadComplete: () => void
}) {
  const { toast } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null)
  const [urls, setUrls] = useState("")
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ClipperBulkSubmitResult | null>(null)

  const handleBulkSubmit = async () => {
    if (!selectedCampaign || !urls.trim()) return
    setUploading(true)
    setResult(null)
    try {
      const urlList = urls.split("\n").map((u) => u.trim()).filter(Boolean)
      const res = await clipperApi.bulkSubmit(token, selectedCampaign, urlList)
      setResult(res)
      toast({ description: `Added ${res.added} submissions`, variant: "success" })
      if (res.added > 0) { onUploadComplete(); setUrls("") }
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Bulk submit failed", variant: "error" })
    } finally {
      setUploading(false)
    }
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (!text) return
      const lines = text.split("\n").slice(1)
      const parsedUrls = lines.map((line) => line.split(",")[0]?.trim()).filter(Boolean)
      setUrls(parsedUrls.join("\n"))
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d3420]/80 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-green-400" />
          <span className="text-sm font-bold text-zinc-200">Bulk Upload</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/[0.06]">
          <div className="pt-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Campaign</label>
            <select
              value={selectedCampaign ?? ""}
              onChange={(e) => setSelectedCampaign(Number(e.target.value) || null)}
              className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
            >
              <option value="">Select campaign...</option>
              {campaigns.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Post URLs (one per line)</label>
              <label className="cursor-pointer text-[10px] text-green-400 hover:text-green-300 transition-colors font-semibold">
                Import CSV
                <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
              </label>
            </div>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={5}
              placeholder={"https://tiktok.com/@user/video/123\nhttps://tiktok.com/@user/video/456"}
              className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 placeholder:text-zinc-600 transition-colors resize-none"
            />
          </div>
          <button
            onClick={handleBulkSubmit}
            disabled={uploading || !selectedCampaign || !urls.trim()}
            className="w-full bg-green-400 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-40"
          >
            {uploading ? "Uploading..." : "Submit URLs"}
          </button>
          {result && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 space-y-1.5">
              <p className="text-xs text-zinc-300">
                Added: <span className="text-green-400 font-bold">{result.added}</span> | Skipped: <span className="text-zinc-400 font-bold">{result.skipped}</span>
              </p>
              {result.results.filter((r) => r.status !== "added").map((r, i) => (
                <p key={i} className="text-[10px] text-zinc-500 truncate">{r.post_url}: {r.reason}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main Dashboard ───────────────────────────────────── */
export default function ClipperDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [dashboard, setDashboard] = useState<ClipperDashboard | null>(null)
  const [campaigns, setCampaigns] = useState<ClipperCampaignOption[]>([])
  const [loading, setLoading] = useState(true)
  const [chatToken, setChatToken] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const loadDashboard = useCallback(async () => {
    const token = getClipperToken()
    if (!token) { router.replace("/viral"); return }
    try {
      const [data, campaignOpts] = await Promise.all([
        clipperApi.dashboardAuth(token),
        clipperApi.campaigns(token),
      ])
      setDashboard(data)
      setCampaigns(campaignOpts)
      try {
        const ct = await clipperAuth.chatToken(token)
        setChatToken(ct.chat_token)
      } catch { /* optional */ }
    } catch {
      clearClipperToken()
      toast({ description: "Session expired. Please login again.", variant: "error" })
      router.replace("/viral")
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const handleLogout = () => { clearClipperToken(); router.push("/viral") }

  if (loading || !dashboard) {
    return (
      <div className="min-h-screen bg-[#0b2518] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const filteredSubmissions = dashboard.submissions.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false
    if (platformFilter !== "all" && s.platform !== platformFilter) return false
    return true
  })

  const needsProofCount = dashboard.submissions.filter(
    (s) => (s.verification_status === "pending" || s.verification_status === "rejected") && s.status !== "paid"
  ).length

  const allStatuses = Array.from(new Set(dashboard.submissions.map((s) => s.status)))
  const allPlatforms = Array.from(new Set(dashboard.submissions.map((s) => s.platform)))

  return (
    <div className="min-h-screen bg-[#0b2518] text-zinc-100 selection:bg-green-500/30">
      {/* Gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-green-400/[0.06] via-green-400/[0.02] to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-to-tl from-emerald-600/[0.04] to-transparent rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        <ClipperNav />

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-zinc-100">
                Welcome back, <span className="text-green-400">{dashboard.name || dashboard.email}</span>
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">{dashboard.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {chatToken && (
                <Link
                  href={`/chat/${chatToken}`}
                  className="inline-flex items-center gap-1.5 border border-white/[0.08] bg-[#0d3420]/60 text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#0d3420] transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Messages
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="border border-white/[0.08] bg-[#0d3420]/60 text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#0d3420] transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Payment Method Warning — always on top if needed */}
          {!dashboard.has_payment_method && (
            <Link
              href="/clipper/settings"
              className="group flex items-center gap-4 rounded-xl border border-red-400/20 bg-red-500/[0.08] px-5 py-4 hover:bg-red-500/[0.12] transition-all"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-400/15 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-red-400" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-400">Set up your payment method</p>
                <p className="text-xs text-zinc-400 mt-0.5">Add a payment method to receive payouts.</p>
              </div>
              <span className="text-xs font-bold text-red-400 group-hover:text-red-300 uppercase tracking-wide flex-shrink-0">
                Set Up &rarr;
              </span>
            </Link>
          )}

          {/* Needs Proof Alert */}
          {needsProofCount > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs text-zinc-300">
                <span className="text-amber-400 font-bold">{needsProofCount} submission{needsProofCount > 1 ? "s" : ""}</span> need{needsProofCount === 1 ? "s" : ""} a proof video to claim payment.
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Submissions" value={formatNumber(dashboard.stats.total_submissions)} />
            <StatCard label="Total Views" value={formatNumber(dashboard.stats.total_views)} />
            <StatCard label="Est. Earnings" value={formatCurrency(dashboard.stats.total_est_earnings)} accent />
            <StatCard label="Paid" value={formatCurrency(dashboard.stats.total_paid)} />
            <StatCard label="Pending" value={formatCurrency(dashboard.stats.pending_earnings)} sub="Awaiting payment" />
          </div>

          {/* Payout Guide — collapsed by default */}
          <CollapsibleSection
            title="How to Claim Your Payment"
            icon={<DollarSign className="w-4 h-4 text-green-400" />}
          >
            <div className="space-y-2.5 pt-3">
              {[
                { n: "1", title: "Upload proof video", desc: "Record your screen showing the analytics/geo breakdown for each clip you submitted." },
                { n: "2", title: "Wait for verification", desc: "Our team will review your proof and verify the view count." },
                { n: "3", title: "Claim payment", desc: "Once verified, hit the \"Claim Payment\" button. You'll only be paid for the views shown in your proof video." },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-green-400/10 text-green-400 text-[10px] font-bold flex items-center justify-center">{step.n}</span>
                  <p className="text-xs text-zinc-400">
                    <span className="text-zinc-200 font-semibold">{step.title}</span> — {step.desc}
                  </p>
                </div>
              ))}
              <p className="text-[10px] text-zinc-500 mt-2">You can re-upload a new proof video anytime to update your verified view count.</p>
            </div>
          </CollapsibleSection>

          {/* Campaigns — collapsed by default */}
          {dashboard.campaigns.length > 0 && (
            <CollapsibleSection
              title="Your Campaigns"
              icon={<ShieldCheck className="w-4 h-4 text-green-400" />}
              count={dashboard.campaigns.length}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-3">
                {dashboard.campaigns.map((c) => (
                  <Link
                    key={c.id}
                    href={`/c/${c.slug}`}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 hover:border-green-400/20 hover:bg-white/[0.05] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">{c.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span>{c.submission_count} clips</span>
                      <span>{formatNumber(c.views)} views</span>
                      <span className="text-green-400">{formatCurrency(c.earnings)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Bulk Upload */}
          <BulkUploadSection token={getClipperToken()!} campaigns={campaigns} onUploadComplete={loadDashboard} />

          {/* Submissions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-zinc-300">Submissions</h2>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0d3420]/80 border border-white/[0.08] text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-400/30 transition-colors"
                >
                  <option value="all" className="bg-[#0d3420]">All Status</option>
                  {allStatuses.map((s) => (<option key={s} value={s} className="bg-[#0d3420]">{s.replace(/_/g, " ")}</option>))}
                </select>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="bg-[#0d3420]/80 border border-white/[0.08] text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-400/30 transition-colors"
                >
                  <option value="all" className="bg-[#0d3420]">All Platforms</option>
                  {allPlatforms.map((p) => (<option key={p} value={p} className="bg-[#0d3420]">{p}</option>))}
                </select>
                <div className="flex items-center border border-white/[0.08] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-green-400/15 text-green-400" : "text-zinc-500 hover:text-zinc-300"}`}
                    title="List view"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-green-400/15 text-green-400" : "text-zinc-500 hover:text-zinc-300"}`}
                    title="Grid view"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-white/[0.08] bg-[#0d3420]/80">
                <p className="text-zinc-500 text-sm">No submissions found.</p>
                <Link href="/" className="inline-block mt-3 text-xs text-green-400 hover:text-green-300 transition-colors">
                  Browse campaigns &rarr;
                </Link>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-2">
                {filteredSubmissions.map((sub) => (
                  <SubmissionCard
                    key={sub.id}
                    submission={sub}
                    token={getClipperToken()!}
                    onRefresh={loadDashboard}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredSubmissions.map((sub) => (
                  <SubmissionCardGrid
                    key={sub.id}
                    submission={sub}
                    token={getClipperToken()!}
                    onRefresh={loadDashboard}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
