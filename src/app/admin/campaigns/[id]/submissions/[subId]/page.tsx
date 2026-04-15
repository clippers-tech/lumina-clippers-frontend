"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getToken } from "@/lib/auth"
import { submissions as subsApi, type Submission } from "@/lib/api"
import { PayoutModal } from "@/components/admin/PayoutModal"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { formatNumber, formatCurrency, platformIcon } from "@/lib/utils"
import { VerificationReview } from "@/components/admin/VerificationReview"
import { ArrowLeft, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/toast"

export default function SubmissionDetailPage() {
  const { id, subId } = useParams<{ id: string; subId: string }>()
  const router = useRouter()
  const campaignId = parseInt(id)
  const submissionId = parseInt(subId)

  const [sub, setSub] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)

  const [editViews, setEditViews] = useState("")
  const [editInteractions, setEditInteractions] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const token = getToken()
    if (!token) return
    subsApi.get(token, submissionId)
      .then((s) => {
        setSub(s)
        setEditViews(s.views.toString())
        setEditInteractions(s.interactions.toString())
        setEditStatus(s.status)
        setEditNotes(s.notes)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [submissionId])

  async function handleSave() {
    setSaving(true)
    try {
      const token = getToken()!
      const updated = await subsApi.update(token, submissionId, {
        views: parseInt(editViews) || 0,
        interactions: parseInt(editInteractions) || 0,
        status: editStatus,
        notes: editNotes,
      })
      setSub(updated)
      toast({ description: "Submission updated successfully", variant: "success" })
    } catch (err) {
      toast({ title: "Save Failed", description: err instanceof Error ? err.message : "Failed to save", variant: "error" })
    } finally {
      setSaving(false)
    }
  }

  async function handleScrape() {
    setScraping(true)
    try {
      const token = getToken()!
      const result = await subsApi.scrape(token, submissionId)
      const updated = await subsApi.get(token, submissionId)
      setSub(updated)
      setEditViews(updated.views.toString())
      setEditInteractions(updated.interactions.toString())
      if (result.status === "success") {
        toast({ title: "Scrape Complete", description: `Views: ${result.views?.toLocaleString() ?? 0}`, variant: "success" })
      } else {
        toast({ title: "Scrape Failed", description: result.error_message || result.detail || "Unknown error", variant: "error" })
      }
    } catch (err) {
      toast({ title: "Scrape Failed", description: err instanceof Error ? err.message : "Could not reach server", variant: "error" })
    } finally {
      setScraping(false)
    }
  }

  async function handlePayout(data: { amount: number; method: string; reference: string }) {
    try {
      const token = getToken()!
      await subsApi.payout(token, submissionId, data)
      const updated = await subsApi.get(token, submissionId)
      setSub(updated)
      setEditStatus(updated.status)
      setPayoutOpen(false)
      toast({ description: "Payout logged successfully", variant: "success" })
    } catch (err) {
      toast({ title: "Payout Failed", description: err instanceof Error ? err.message : "Failed", variant: "error" })
    }
  }

  async function handleReject() {
    if (!confirm("Reject this submission?")) return
    const token = getToken()!
    await subsApi.delete(token, submissionId)
    router.push(`/admin/campaigns/${campaignId}`)
  }

  function getEmbedUrl(platform: string, postUrl: string): string | null {
    if (platform === "youtube") {
      let videoId = ""
      const watchMatch = postUrl.match(/[?&]v=([^&]+)/)
      const shortsMatch = postUrl.match(/shorts\/([^/?]+)/)
      const shortUrlMatch = postUrl.match(/youtu\.be\/([^/?]+)/)
      videoId = watchMatch?.[1] || shortsMatch?.[1] || shortUrlMatch?.[1] || ""
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    if (platform === "tiktok") {
      const idMatch = postUrl.match(/video\/(\d+)/)
      return idMatch ? `https://www.tiktok.com/embed/v2/${idMatch[1]}` : null
    }
    if (platform === "instagram") {
      const codeMatch = postUrl.match(/\/(p|reel|reels)\/([^/?]+)/)
      return codeMatch ? `https://www.instagram.com/p/${codeMatch[2]}/embed` : null
    }
    return null
  }

  if (loading || !sub) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>
  }

  const embedUrl = getEmbedUrl(sub.platform, sub.post_url)
  const isVertical = sub.platform !== "youtube" || sub.post_url.includes("shorts")
  const inputClass = "w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30"
  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block"

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/admin/campaigns/${campaignId}`} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to campaign
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <span className="text-2xl">{platformIcon(sub.platform)}</span>
            Submission #{sub.id}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{sub.clipper_email}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={sub.status} />
          <StatusBadge status={sub.scrape_status} />
        </div>
      </div>

      {/* Scrape error */}
      {sub.scrape_status === "failed" && sub.scrape_error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 mb-6">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Last scrape failed</p>
            <p className="text-sm text-red-400/80 mt-0.5">{sub.scrape_error}</p>
          </div>
        </div>
      )}

      {/* Post URL */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={labelClass}>Post URL</p>
            <a href={sub.post_url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-400 hover:underline flex items-center gap-1.5">
              {sub.post_url} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="text-right">
            <p className={labelClass}>Clipper</p>
            <p className="text-sm text-zinc-100">{sub.clipper_name || sub.clipper_email}</p>
          </div>
        </div>
      </div>

      {/* Embed */}
      {embedUrl && (
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] overflow-hidden mb-6">
          <div className={`relative w-full ${isVertical ? "max-w-[360px] mx-auto" : ""}`} style={{ aspectRatio: isVertical ? "9/16" : "16/9" }}>
            <iframe src={embedUrl} className="absolute inset-0 w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Views", value: formatNumber(sub.views) },
          { label: "Likes", value: formatNumber(sub.likes) },
          { label: "Comments", value: formatNumber(sub.comments) },
          { label: "Est. Earnings", value: formatCurrency(sub.est_earnings), accent: true },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4">
            <p className={labelClass}>{s.label}</p>
            <p className={`text-2xl font-bold ${s.accent ? "text-green-400" : "text-zinc-100"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Verification */}
      <div className="mb-6">
        <VerificationReview
          submissionId={submissionId}
          initialVerificationStatus={sub.verification_status}
          initialVerificationNote={sub.verification_note}
          onVerified={(status) => setSub((prev) => prev ? { ...prev, verification_status: status } : prev)}
        />
      </div>

      {/* Admin controls */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-6 mb-6">
        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-4">Admin Controls</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Manual Views Override</label><input type="number" value={editViews} onChange={(e) => setEditViews(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Manual Interactions Override</label><input type="number" value={editInteractions} onChange={(e) => setEditInteractions(e.target.value)} className={inputClass} /></div>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputClass}>
              <option value="awaiting_stats">Awaiting Stats</option>
              <option value="stats_verified">Stats Verified</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Internal Notes</label>
            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} placeholder="Admin notes..." className={`${inputClass} resize-none`} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="flex-1 h-10 bg-green-400 text-black font-extrabold text-xs px-6 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={handleScrape} disabled={scraping} className="flex items-center gap-1.5 border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-4 py-2 rounded-lg transition-all">
              <RefreshCw className={`w-4 h-4 ${scraping ? "animate-spin" : ""}`} />
              {scraping ? "Scraping..." : "Re-Scrape"}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => setPayoutOpen(true)} disabled={sub.status === "paid"} className="flex-1 h-10 bg-green-400 text-black font-extrabold text-xs px-6 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50">
          {sub.status === "paid" ? "Already Paid" : "Log Payout"}
        </button>
        <button onClick={handleReject} disabled={sub.status === "rejected"} className="bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50">
          Reject
        </button>
      </div>

      {payoutOpen && (
        <PayoutModal
          submissionId={submissionId}
          suggestedAmount={sub.est_earnings}
          onConfirm={handlePayout}
          onClose={() => setPayoutOpen(false)}
        />
      )}
    </div>
  )
}
