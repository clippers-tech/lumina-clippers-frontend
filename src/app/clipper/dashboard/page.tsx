"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Upload, DollarSign, AlertCircle,
  Wallet, Clock,
  ChevronLeft, ChevronRight, ExternalLink, Loader2,
} from "lucide-react"
import {
  clipperApi, clipperAuth, verification,
  type ClipperDashboard, type ClipperSubmission,
  type ClipperCampaignOption, type ClipperBulkSubmitResult,
} from "@/lib/api"
import { getClipperToken, clearClipperToken } from "@/lib/clipper-auth"
import { formatNumber, formatCurrency, platformIcon, statusColor } from "@/lib/utils"
import { ClipperNav } from "@/components/clipper/ClipperNav"
import { AtmosphericBackground } from "@/components/layout/AtmosphericBackground"
import { useToast } from "@/components/ui/toast"

/* ─────────────────────────────────────────────────────────
   CLAIM PAYOUTS — always visible, swipeable on mobile
   ───────────────────────────────────────────────────────── */
const PAYOUT_STEPS = [
  { n: "1", title: "Upload proof video", desc: "Record your screen showing the analytics & geo breakdown for each clip.", icon: "\ud83c\udfa5" },
  { n: "2", title: "Wait for verification", desc: "Our team reviews your proof and verifies the view count.", icon: "\ud83d\udd0d" },
  { n: "3", title: "Claim payment", desc: 'Once verified, hit "Claim Payment". You\'re paid for verified views only.', icon: "\ud83d\udcb0" },
]

function ClaimPayoutsSection() {
  const [activeStep, setActiveStep] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartX = useRef(0)

  // Auto-advance — use scrollLeft, NOT scrollIntoView
  useEffect(() => {
    autoRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3)
    }, 3500)
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [])

  // Scroll container horizontally (no page scroll)
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const cardWidth = el.scrollWidth / 3
    el.scrollTo({ left: cardWidth * activeStep, behavior: "smooth" })
  }, [activeStep])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    if (autoRef.current) clearInterval(autoRef.current)
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      setActiveStep((prev) => diff > 0 ? Math.min(prev + 1, 2) : Math.max(prev - 1, 0))
    }
  }

  return (
    <div className="rounded-xl border border-green-400/20 bg-gradient-to-r from-green-400/[0.06] via-transparent to-transparent p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-green-400/15 flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-green-400">Claim Payouts</p>
          <p className="text-[10px] text-zinc-500">3 steps to get paid</p>
        </div>
      </div>

      {/* Desktop: 3-col grid */}
      <div className="hidden md:grid grid-cols-3 gap-3">
        {PAYOUT_STEPS.map((step) => (
          <div key={step.n} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{step.icon}</span>
              <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">Step {step.n}</span>
            </div>
            <p className="text-xs font-bold text-zinc-200 mb-1">{step.title}</p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Mobile: horizontal scroll slider */}
      <div className="md:hidden">
        <div
          ref={containerRef}
          className="flex gap-3 overflow-x-hidden scroll-smooth"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {PAYOUT_STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`min-w-full rounded-lg border p-4 transition-all duration-300 ${
                i === activeStep
                  ? "border-green-400/20 bg-green-400/[0.05]"
                  : "border-white/[0.06] bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{step.icon}</span>
                <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">Step {step.n}</span>
              </div>
              <p className="text-sm font-bold text-zinc-200 mb-1">{step.title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          {PAYOUT_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveStep(i); if (autoRef.current) clearInterval(autoRef.current) }}
              className={`rounded-full transition-all duration-300 ${
                i === activeStep ? "w-6 h-2 bg-green-400" : "w-2 h-2 bg-white/[0.15]"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="text-[10px] text-zinc-600 mt-3">You can re-upload a new proof video anytime to update your verified view count.</p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   PROOF UPLOAD INLINE
   ───────────────────────────────────────────────────────── */
function ProofUploadInline({
  submissionId, submissionToken, isReupload, onComplete,
}: {
  submissionId: number; submissionToken: string; isReupload?: boolean; onComplete: () => void
}) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("video/")) { toast({ description: "Please select a video file", variant: "error" }); return }
    if (file.size > 100 * 1024 * 1024) { toast({ description: "File must be under 100MB", variant: "error" }); return }
    setUploading(true); setProgress(0)
    try {
      await verification.upload(submissionToken, submissionId, file, setProgress)
      toast({ description: isReupload ? "New proof video uploaded" : "Proof video uploaded successfully", variant: "success" })
      onComplete()
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Upload failed", variant: "error" })
    } finally { setUploading(false); setProgress(0) }
  }

  return (
    <div className="mt-3">
      {uploading ? (
        <div className="rounded-lg border border-green-400/[0.1] bg-green-400/[0.03] p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Uploading...</span>
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
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${
            dragOver ? "border-green-400/40 bg-green-400/[0.05]" : "border-white/[0.08] hover:border-green-400/20"
          }`}
          onClick={() => {
            const input = document.createElement("input"); input.type = "file"; input.accept = "video/*"
            input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f) }
            input.click()
          }}
        >
          <Upload className="w-5 h-5 text-zinc-500 mx-auto mb-1" />
          <p className="text-xs text-zinc-400">{isReupload ? "Drop new proof or " : "Drop proof video or "}<span className="text-green-400 font-semibold">click to browse</span></p>
          <p className="text-[10px] text-zinc-600 mt-0.5">.mp4, .mov, .webm — max 100MB</p>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   SUBMISSION ROW — compact, table-like
   ───────────────────────────────────────────────────────── */
function SubmissionRow({ sub, token, onRefresh }: { sub: ClipperSubmission; token: string; onRefresh: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const [showUpload, setShowUpload] = useState(false)
  const [claiming, setClaiming] = useState(false)

  const vs = sub.verification_status || "pending"
  const isPaid = sub.status === "paid"
  const isClaimed = sub.status === "payment_claimed"
  const canClaim = (vs === "uploaded" || vs === "verified") && !isPaid && !isClaimed
  const needsProof = (vs === "pending" || vs === "rejected") && !isPaid

  const isSyncing = sub.scrape_status === "pending" || sub.scrape_status === "running"

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setClaiming(true)
    try {
      await clipperApi.claimPayment(token, sub.id)
      toast({ description: "Payment claimed.", variant: "success" })
      onRefresh()
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Claim failed", variant: "error" })
    } finally { setClaiming(false) }
  }

  return (
    <div className="border-b border-white/[0.08] last:border-b-0">
      {/* Desktop row */}
      <div
        onClick={() => router.push(`/clipper/submission/${sub.id}`)}
        className="hidden sm:flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-white/[0.05] shrink-0 flex items-center justify-center text-sm">
          {platformIcon(sub.platform)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-zinc-200 truncate">{sub.campaign_name}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{sub.platform}</span>
          </div>
          <span className="text-[10px] text-zinc-600 truncate block">{sub.post_url}</span>
        </div>
        <div className="text-right shrink-0">
          {isSyncing ? (
            <div className="flex items-center gap-1 animate-pulse">
              <Loader2 className="w-3 h-3 text-zinc-500 animate-spin" />
              <span className="text-[10px] text-zinc-500">Syncing clip data...</span>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-zinc-200">{formatNumber(sub.views)}</p>
              <p className="text-[10px] text-green-400 font-semibold">{formatCurrency(sub.est_earnings)}</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isPaid && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Paid</span>
          )}
          {isClaimed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">Pending</span>
          )}
          {canClaim && (
            <button onClick={handleClaim} disabled={claiming}
              className="text-[10px] font-bold uppercase tracking-wider bg-green-400 text-black px-2.5 py-1 rounded-lg hover:bg-green-300 transition-all disabled:opacity-50"
            >{claiming ? "..." : "Claim Payment"}</button>
          )}
          {needsProof && (
            <button onClick={(e) => { e.stopPropagation(); setShowUpload(!showUpload) }}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-green-400 text-black px-2.5 py-1 rounded-lg hover:bg-green-300 transition-all"
            ><Upload className="w-3 h-3" /> Upload Proof to Claim Payments</button>
          )}
        </div>
      </div>

      {/* Mobile card */}
      <div
        onClick={() => router.push(`/clipper/submission/${sub.id}`)}
        className="sm:hidden p-4 cursor-pointer hover:bg-white/[0.02] transition-colors space-y-2.5"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/[0.05] shrink-0 flex items-center justify-center text-sm">
            {platformIcon(sub.platform)}
          </div>
          <span className="text-xs font-semibold text-zinc-200 truncate flex-1">{sub.campaign_name}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{sub.platform}</span>
        </div>
        <span className="text-[10px] text-zinc-600 truncate block">{sub.post_url}</span>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSyncing ? (
              <div className="flex items-center gap-1 animate-pulse">
                <Loader2 className="w-3 h-3 text-zinc-500 animate-spin" />
                <span className="text-[10px] text-zinc-500">Syncing clip data...</span>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-[10px] text-zinc-500">Views</p>
                  <p className="text-xs font-bold text-zinc-200">{formatNumber(sub.views)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500">Earnings</p>
                  <p className="text-xs font-bold text-green-400">{formatCurrency(sub.est_earnings)}</p>
                </div>
              </>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            {isPaid && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Paid</span>
            )}
            {isClaimed && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">Pending</span>
            )}
            {canClaim && (
              <button onClick={handleClaim} disabled={claiming}
                className="text-[10px] font-bold uppercase tracking-wider bg-green-400 text-black px-2 py-1 rounded-lg hover:bg-green-300 transition-all disabled:opacity-50"
              >{claiming ? "..." : "Claim Payment"}</button>
            )}
            {needsProof && (
              <button onClick={(e) => { e.stopPropagation(); setShowUpload(!showUpload) }}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-green-400 text-black px-2 py-1 rounded-lg hover:bg-green-300 transition-all"
              ><Upload className="w-3 h-3" /> Upload Proof to Claim Payments</button>
            )}
          </div>
        </div>
      </div>

      {showUpload && (
        <div className="px-4 pb-3">
          <ProofUploadInline submissionId={sub.id} submissionToken={sub.submission_token} isReupload={vs === "uploaded" || vs === "verified" || vs === "rejected"} onComplete={() => { setShowUpload(false); onRefresh() }} />
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   SUBMIT NEW — inline campaign submission
   ───────────────────────────────────────────────────────── */
type SubmitMode = "single" | "bulk"

function SubmitNewTab({
  token, campaigns, onSubmitComplete,
}: {
  token: string; campaigns: ClipperCampaignOption[]; onSubmitComplete: () => void
}) {
  const { toast } = useToast()
  const [mode, setMode] = useState<SubmitMode>("single")
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null)
  const [singleUrl, setSingleUrl] = useState("")
  const [urls, setUrls] = useState("")
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ClipperBulkSubmitResult | null>(null)

  const handleSubmit = async () => {
    const urlList = mode === "single"
      ? [singleUrl.trim()].filter(Boolean)
      : urls.split("\n").map((u) => u.trim()).filter(Boolean)
    if (!selectedCampaign || urlList.length === 0) return
    setUploading(true); setResult(null)
    try {
      const res = await clipperApi.bulkSubmit(token, selectedCampaign, urlList)
      setResult(res)
      toast({ description: `Added ${res.added} submission${res.added !== 1 ? "s" : ""}`, variant: "success" })
      if (res.added > 0) { onSubmitComplete(); setSingleUrl(""); setUrls("") }
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Submit failed", variant: "error" })
    } finally { setUploading(false) }
  }

  const canSubmit = selectedCampaign && (mode === "single" ? singleUrl.trim() : urls.trim())

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.04] w-fit">
        <button
          onClick={() => setMode("single")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            mode === "single" ? "bg-green-400 text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >Single URL</button>
        <button
          onClick={() => setMode("bulk")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            mode === "bulk" ? "bg-green-400 text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >Bulk URLs</button>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Campaign</label>
        <select
          value={selectedCampaign ?? ""}
          onChange={(e) => setSelectedCampaign(Number(e.target.value) || null)}
          className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-400/30 transition-colors"
        >
          <option value="" className="bg-[#0b2518]">Select campaign...</option>
          {campaigns.map((c) => <option key={c.id} value={c.id} className="bg-[#0b2518]">{c.name}</option>)}
        </select>
      </div>

      {mode === "single" ? (
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Post URL</label>
          <input
            type="url"
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            placeholder="https://tiktok.com/@user/video/123"
            className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-400/30 placeholder:text-zinc-600 transition-colors"
          />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Post URLs (one per line)</label>
          </div>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={6}
            placeholder={"https://tiktok.com/@user/video/123\nhttps://tiktok.com/@user/video/456"}
            className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-400/30 placeholder:text-zinc-600 transition-colors resize-none"
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={uploading || !canSubmit}
        className="w-full bg-green-400 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-40"
      >
        {uploading ? "Submitting..." : mode === "single" ? "Submit URL" : "Submit URLs"}
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
  )
}

/* ─────────────────────────────────────────────────────────
   MAIN DASHBOARD
   ───────────────────────────────────────────────────────── */
type TabKey = "submissions" | "submit" | "campaigns" | "payments"

const ITEMS_PER_PAGE = 15

export default function ClipperDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [dashboard, setDashboard] = useState<ClipperDashboard | null>(null)
  const [campaigns, setCampaigns] = useState<ClipperCampaignOption[]>([])
  const [loading, setLoading] = useState(true)
  const [chatToken, setChatToken] = useState<string | null>(null)

  // Tabs + filters
  const [activeTab, setActiveTab] = useState<TabKey>("submissions")
  const [statusFilter, setStatusFilter] = useState("all")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [subPage, setSubPage] = useState(1)

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
    } finally { setLoading(false) }
  }, [router, toast])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  if (loading || !dashboard) {
    return (
      <AtmosphericBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </AtmosphericBackground>
    )
  }

  // Filtered + paginated submissions
  const filteredSubs = dashboard.submissions.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false
    if (platformFilter !== "all" && s.platform !== platformFilter) return false
    return true
  })
  const totalSubPages = Math.max(1, Math.ceil(filteredSubs.length / ITEMS_PER_PAGE))
  const pagedSubs = filteredSubs.slice((subPage - 1) * ITEMS_PER_PAGE, subPage * ITEMS_PER_PAGE)

  const needsProofCount = dashboard.submissions.filter(
    (s) => (s.verification_status === "pending" || s.verification_status === "rejected") && s.status !== "paid"
  ).length

  const claimedSubs = dashboard.submissions.filter((s) => s.status === "payment_claimed")

  const allStatuses = Array.from(new Set(dashboard.submissions.map((s) => s.status)))
  const allPlatforms = Array.from(new Set(dashboard.submissions.map((s) => s.platform)))

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "submissions", label: "Submissions", count: dashboard.submissions.length },
    { key: "submit", label: "Submit New" },
    { key: "campaigns", label: "Campaigns", count: dashboard.campaigns.length },
    ...(claimedSubs.length > 0 ? [{ key: "payments" as TabKey, label: "Payments", count: claimedSubs.length }] : []),
  ]

  return (
    <AtmosphericBackground>
      <ClipperNav chatToken={chatToken} />

      <main className="max-w-5xl mx-auto px-4 py-6 pt-20 space-y-5">
        {/* Header — compact */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">Dashboard</p>
          <h1 className="text-xl font-bold text-zinc-100">
            Welcome back, <span className="text-green-400">{dashboard.name || dashboard.email}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">{dashboard.email}</p>
        </div>

        {/* Payment method warning */}
        {!dashboard.has_payment_method && (
          <Link
            href="/clipper/settings"
            className="group flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.06] px-4 py-3 hover:bg-red-500/[0.1] transition-all"
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-red-400/15 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-red-400" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-400">Set up your payment method</p>
              <p className="text-[10px] text-zinc-500">Add a payment method to receive payouts.</p>
            </div>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide shrink-0">Set Up &rarr;</span>
          </Link>
        )}

        {/* Claim Payouts */}
        <ClaimPayoutsSection />

        {/* Needs proof alert */}
        {needsProofCount > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-400/20 bg-amber-500/[0.06] px-4 py-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-zinc-300">
              <span className="text-amber-400 font-bold">{needsProofCount}</span> submission{needsProofCount > 1 ? "s" : ""} need{needsProofCount === 1 ? "s" : ""} a proof video.
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { label: "Submissions", value: formatNumber(dashboard.stats.total_submissions) },
            { label: "Total Views", value: formatNumber(dashboard.stats.total_views) },
            { label: "Est. Earnings", value: formatCurrency(dashboard.stats.total_est_earnings), accent: true },
            { label: "Paid", value: formatCurrency(dashboard.stats.total_paid) },
            { label: "Pending", value: formatCurrency(dashboard.stats.pending_earnings) },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-3 ${
              s.accent ? "border-green-400/20 bg-green-400/[0.04]" : "border-white/[0.04] bg-white/[0.015]"
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{s.label}</span>
              <p className={`text-lg font-extrabold mt-0.5 ${s.accent ? "text-green-400" : "text-zinc-100"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tab bar — matches admin style */}
        <div className="flex gap-1 border-b border-white/[0.06] overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSubPage(1) }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.key ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-[10px] font-bold text-zinc-600">{tab.count}</span>
              )}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-400 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0d1f16] overflow-hidden">

          {/* ── Submissions tab ───────────────────────────── */}
          {activeTab === "submissions" && (
            <div>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setSubPage(1) }}
                  className="bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  <option value="all" className="bg-[#0b2518]">All Status</option>
                  {allStatuses.map((s) => <option key={s} value={s} className="bg-[#0b2518]">{s.replace(/_/g, " ")}</option>)}
                </select>
                <select value={platformFilter} onChange={(e) => { setPlatformFilter(e.target.value); setSubPage(1) }}
                  className="bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  <option value="all" className="bg-[#0b2518]">All Platforms</option>
                  {allPlatforms.map((p) => <option key={p} value={p} className="bg-[#0b2518]">{p}</option>)}
                </select>
                <span className="text-[10px] text-zinc-600 ml-auto">{filteredSubs.length} result{filteredSubs.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Rows */}
              {pagedSubs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500 text-sm">No submissions found.</p>
                  <button onClick={() => setActiveTab("submit")} className="mt-2 text-xs text-green-400 hover:text-green-300 transition-colors">
                    Submit your first clip &rarr;
                  </button>
                </div>
              ) : (
                pagedSubs.map((sub) => (
                  <SubmissionRow key={sub.id} sub={sub} token={getClipperToken()!} onRefresh={loadDashboard} />
                ))
              )}

              {/* Pagination */}
              {totalSubPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => setSubPage((p) => Math.max(1, p - 1))}
                    disabled={subPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-zinc-500">
                    Page {subPage} of {totalSubPages}
                  </span>
                  <button
                    onClick={() => setSubPage((p) => Math.min(totalSubPages, p + 1))}
                    disabled={subPage === totalSubPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Submit New tab ────────────────────────────── */}
          {activeTab === "submit" && (
            <div className="p-5">
              <SubmitNewTab
                token={getClipperToken()!}
                campaigns={campaigns}
                onSubmitComplete={() => { loadDashboard(); setActiveTab("submissions") }}
              />
            </div>
          )}

          {/* ── Campaigns tab ────────────────────────────── */}
          {activeTab === "campaigns" && (
            <div>
              {dashboard.campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500 text-sm">No campaigns yet.</p>
                  <Link href="/" className="mt-2 inline-block text-xs text-green-400 hover:text-green-300 transition-colors">
                    Browse campaigns &rarr;
                  </Link>
                </div>
              ) : (
                dashboard.campaigns.map((c) => (
                  <Link
                    key={c.id}
                    href={`/c/${c.slug}`}
                    className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">{c.name}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(c.status)}`}>{c.status}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                        <span>{c.submission_count} clips</span>
                        <span>{formatNumber(c.views)} views</span>
                        {c.requirements_url && (
                          <a href={c.requirements_url} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-semibold text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Requirements
                          </a>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-400 shrink-0">{formatCurrency(c.earnings)}</span>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* ── Payments tab ─────────────────────────────── */}
          {activeTab === "payments" && (
            <div>
              {claimedSubs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500 text-sm">No pending payment claims.</p>
                </div>
              ) : (
                claimedSubs.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04] last:border-b-0">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] shrink-0 flex items-center justify-center text-sm">
                      {platformIcon(sub.platform)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{sub.campaign_name}</p>
                      <a href={sub.post_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-600 hover:text-green-400 transition-colors truncate block">{sub.post_url}</a>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-zinc-200">{formatNumber(sub.views)} views</p>
                      <p className="text-[10px] text-green-400 font-semibold">{formatCurrency(sub.est_earnings)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded shrink-0">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  </div>
                ))
              )}
              <p className="text-[10px] text-zinc-600 px-4 py-3">These submissions are being processed. You will be paid shortly.</p>
            </div>
          )}
        </div>
      </main>
    </AtmosphericBackground>
  )
}
