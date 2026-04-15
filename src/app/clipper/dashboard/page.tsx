"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, ChevronDown, MessageSquare } from "lucide-react"
import { clipperApi, clipperAuth, type ClipperDashboard, type ClipperCampaignOption, type ClipperBulkSubmitResult } from "@/lib/api"
import { getClipperToken, clearClipperToken } from "@/lib/clipper-auth"
import { formatNumber, formatCurrency, platformIcon, statusColor } from "@/lib/utils"
import { ClipperNav } from "@/components/clipper/ClipperNav"
import { useToast } from "@/components/ui/toast"

/* ── Sub-components ───────────────────────────────────── */

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
      <p className="text-xl font-extrabold text-zinc-100 mt-1">{value}</p>
      {sub && <p className="text-[10px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function PlatformPill({ platform }: { platform: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/[0.05] text-zinc-300 border border-white/[0.06]">
      {platformIcon(platform.toLowerCase())} {platform}
    </span>
  )
}

function SubmissionRow({ submission }: { submission: ClipperDashboard["submissions"][0] }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4 flex items-center gap-4">
      {/* Thumbnail */}
      {submission.thumbnail_url ? (
        <img src={submission.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-white/[0.05] shrink-0 flex items-center justify-center text-lg">
          {platformIcon(submission.platform)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-zinc-200 truncate">{submission.campaign_name}</span>
          <PlatformPill platform={submission.platform} />
        </div>
        <a
          href={submission.post_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-zinc-500 hover:text-lime-400 transition-colors truncate block"
        >
          {submission.post_url}
        </a>
      </div>

      <div className="text-right shrink-0 space-y-0.5">
        <p className="text-xs font-bold text-zinc-200">{formatNumber(submission.views)} views</p>
        <p className="text-xs text-lime-400 font-semibold">{formatCurrency(submission.est_earnings)}</p>
      </div>

      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${statusColor(submission.status)}`}>
        {submission.status.replace(/_/g, " ")}
      </span>
    </div>
  )
}

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
      const urlList = urls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean)
      const res = await clipperApi.bulkSubmit(token, selectedCampaign, urlList)
      setResult(res)
      toast({ description: `Added ${res.added} submissions`, variant: "success" })
      if (res.added > 0) {
        onUploadComplete()
        setUrls("")
      }
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : "Bulk submit failed",
        variant: "error",
      })
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
      const lines = text.split("\n").slice(1) // skip header
      const parsedUrls = lines
        .map((line) => {
          const cols = line.split(",")
          return cols[0]?.trim()
        })
        .filter(Boolean)
      setUrls(parsedUrls.join("\n"))
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-lime-400" />
          <span className="text-sm font-bold text-zinc-200">Bulk Upload</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/[0.04]">
          <div className="pt-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
              Campaign
            </label>
            <select
              value={selectedCampaign ?? ""}
              onChange={(e) => setSelectedCampaign(Number(e.target.value) || null)}
              className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30 transition-colors"
            >
              <option value="">Select campaign...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Post URLs (one per line)
              </label>
              <label className="cursor-pointer text-[10px] text-lime-400 hover:text-lime-300 transition-colors font-semibold">
                Import CSV
                <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
              </label>
            </div>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={5}
              placeholder={"https://tiktok.com/@user/video/123\nhttps://tiktok.com/@user/video/456"}
              className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30 placeholder:text-zinc-600 transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleBulkSubmit}
            disabled={uploading || !selectedCampaign || !urls.trim()}
            className="w-full bg-lime-400 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(163,230,53,0.4)] hover:bg-lime-300 transition-all disabled:opacity-40"
          >
            {uploading ? "Uploading..." : "Submit URLs"}
          </button>

          {result && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 space-y-1.5">
              <p className="text-xs text-zinc-300">
                Added: <span className="text-lime-400 font-bold">{result.added}</span> | Skipped:{" "}
                <span className="text-zinc-400 font-bold">{result.skipped}</span>
              </p>
              {result.results
                .filter((r) => r.status !== "added")
                .map((r, i) => (
                  <p key={i} className="text-[10px] text-zinc-500 truncate">
                    {r.post_url}: {r.reason}
                  </p>
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

  // Filters
  const [statusFilter, setStatusFilter] = useState("all")
  const [platformFilter, setPlatformFilter] = useState("all")

  const loadDashboard = useCallback(async () => {
    const token = getClipperToken()
    if (!token) {
      router.replace("/viral")
      return
    }
    try {
      const [data, campaignOpts] = await Promise.all([
        clipperApi.dashboardAuth(token),
        clipperApi.campaigns(token),
      ])
      setDashboard(data)
      setCampaigns(campaignOpts)

      // Get chat token
      try {
        const ct = await clipperAuth.chatToken(token)
        setChatToken(ct.chat_token)
      } catch {
        // chat token optional
      }
    } catch {
      clearClipperToken()
      toast({ description: "Session expired. Please login again.", variant: "error" })
      router.replace("/viral")
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleLogout = () => {
    clearClipperToken()
    router.push("/viral")
  }

  if (loading || !dashboard) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const filteredSubmissions = dashboard.submissions.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false
    if (platformFilter !== "all" && s.platform !== platformFilter) return false
    return true
  })

  const allStatuses = Array.from(new Set(dashboard.submissions.map((s) => s.status)))
  const allPlatforms = Array.from(new Set(dashboard.submissions.map((s) => s.platform)))

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-lime-500/30">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-lime-400/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        <ClipperNav />

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-zinc-100">
                Welcome back, <span className="text-lime-400">{dashboard.name || dashboard.email}</span>
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">{dashboard.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {chatToken && (
                <Link
                  href={`/chat/${chatToken}`}
                  className="inline-flex items-center gap-1.5 border border-white/[0.06] bg-transparent text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Messages
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="border border-white/[0.06] bg-transparent text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Submissions" value={formatNumber(dashboard.stats.total_submissions)} />
            <StatCard label="Total Views" value={formatNumber(dashboard.stats.total_views)} />
            <StatCard label="Est. Earnings" value={formatCurrency(dashboard.stats.total_est_earnings)} />
            <StatCard label="Paid" value={formatCurrency(dashboard.stats.total_paid)} />
            <StatCard
              label="Pending"
              value={formatCurrency(dashboard.stats.pending_earnings)}
              sub="Awaiting payment"
            />
          </div>

          {/* Campaigns */}
          {dashboard.campaigns.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-zinc-300 mb-3">Your Campaigns</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {dashboard.campaigns.map((c) => (
                  <Link
                    key={c.id}
                    href={`/c/${c.slug}`}
                    className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4 hover:border-white/[0.08] hover:bg-white/[0.025] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">{c.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span>{c.submission_count} clips</span>
                      <span>{formatNumber(c.views)} views</span>
                      <span className="text-lime-400">{formatCurrency(c.earnings)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Upload */}
          <BulkUploadSection
            token={getClipperToken()!}
            campaigns={campaigns}
            onUploadComplete={loadDashboard}
          />

          {/* Submissions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-zinc-300">Submissions</h2>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-lime-400/30 transition-colors"
                >
                  <option value="all">All Status</option>
                  {allStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-lime-400/30 transition-colors"
                >
                  <option value="all">All Platforms</option>
                  {allPlatforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px]">
                <p className="text-zinc-500 text-sm">No submissions found.</p>
                <Link
                  href="/"
                  className="inline-block mt-3 text-xs text-lime-400 hover:text-lime-300 transition-colors"
                >
                  Browse campaigns &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSubmissions.map((sub) => (
                  <SubmissionRow key={sub.id} submission={sub} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
