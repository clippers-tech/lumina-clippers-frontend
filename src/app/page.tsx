"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { publicApi, type PublicCampaign } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { LuminaLogo } from "@/components/LuminaLogo"

/* ── Grid Background ─────────────────────────────────── */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-400/[0.03] rounded-full blur-[120px]" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/[0.02] rounded-full blur-[100px]" />
    </div>
  )
}

/* ── Default Thumbnail (CSS-based branded card) ───────── */
const THUMB_COLORS: Record<string, { bg: string; accent: string }> = {
  "adobe-clipping-campaign": {
    bg: "from-red-900/90 via-red-800/80 to-red-950/90",
    accent: "text-red-300",
  },
  "algorant-twitter-only-campaign": {
    bg: "from-slate-800/90 via-slate-700/80 to-slate-900/90",
    accent: "text-teal-300",
  },
}

const DEFAULT_THUMB = {
  bg: "from-emerald-900/80 via-emerald-800/70 to-emerald-950/80",
  accent: "text-emerald-300",
}

function CampaignThumbnail({ campaign }: { campaign: PublicCampaign }) {
  if (campaign.thumbnail_url) {
    return (
      <div className="relative h-48 overflow-hidden">
        <img
          src={campaign.thumbnail_url}
          alt={campaign.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a10] via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 backdrop-blur-sm border border-emerald-400/20">
            {campaign.status}
          </span>
        </div>
      </div>
    )
  }

  const colors = THUMB_COLORS[campaign.slug] || DEFAULT_THUMB
  const initials = campaign.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase()

  return (
    <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${colors.bg} flex flex-col items-center justify-center p-6`}>
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[size:20px_20px]" />
      </div>
      <div className="absolute top-3 left-3 z-10">
        <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 backdrop-blur-sm border border-emerald-400/20">
          {campaign.status}
        </span>
      </div>
      <div className={`text-4xl font-black tracking-wider ${colors.accent} opacity-40 mb-2`}>
        {initials}
      </div>
      <div className="text-center">
        <p className="text-white/90 font-extrabold text-sm uppercase tracking-wide leading-tight max-w-[200px]">
          {campaign.name}
        </p>
        {campaign.budget_total > 0 && (
          <p className="text-white/50 text-xs font-semibold mt-1.5">
            {formatCurrency(campaign.budget_total)} Budget
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Campaign Card ────────────────────────────────────── */
function CampaignCard({ campaign }: { campaign: PublicCampaign }) {
  const budgetPct = campaign.budget_total > 0 ? Math.min(100, (campaign.budget_used / campaign.budget_total) * 100) : 0

  return (
    <div className="group rounded-xl border border-white/[0.06] bg-[#0a1a10]/60 backdrop-blur-[2px] overflow-hidden transition-all hover:border-green-400/20 hover:shadow-[0_0_30px_-10px_rgba(74,222,128,0.15)]">
      {/* Thumbnail */}
      <CampaignThumbnail campaign={campaign} />

      <div className="p-5 space-y-4">
        {/* Name + Description */}
        <div>
          <h3 className="font-extrabold text-base text-zinc-100 group-hover:text-white transition-colors">
            {campaign.name} Campaign
          </h3>
          {campaign.description && (
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{campaign.description}</p>
          )}
        </div>

        {/* CPM + Max Payout pills */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs">
            <span className="text-zinc-500 font-medium mr-1.5">CPM</span>
            <span className="text-zinc-200 font-bold">{formatCurrency(campaign.cpm_rate)} / 1k views</span>
          </span>
          {campaign.max_payout > 0 && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs">
              <span className="text-zinc-500 font-medium mr-1.5">Max payout</span>
              <span className="text-zinc-200 font-bold">{formatCurrency(campaign.max_payout)}</span>
            </span>
          )}
        </div>

        {/* Budget bar */}
        {campaign.budget_total > 0 && (
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 font-medium">Campaign Budget</span>
              <span className="text-xs text-zinc-200 font-bold">
                {formatCurrency(campaign.budget_used)} / {formatCurrency(campaign.budget_total)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-green-400 transition-all duration-500"
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p className="text-right text-[10px] text-zinc-500 mt-1">{budgetPct.toFixed(1)}% used</p>
          </div>
        )}

        {/* Submit button */}
        {campaign.status === "open" && (
          <Link
            href={`/c/${campaign.slug}`}
            className="block w-full text-center bg-green-400 text-black font-extrabold text-sm px-6 py-3 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all"
          >
            Submit &amp; continue to payout
          </Link>
        )}
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────── */
export default function HomePage() {
  const [allCampaigns, setAllCampaigns] = useState<PublicCampaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.campaigns()
      .then((data) => setAllCampaigns(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openCampaigns = allCampaigns.filter((c) => c.status === "open")
  const completedCampaigns = allCampaigns.filter((c) => c.status !== "open")

  return (
    <div className="relative min-h-screen bg-[#050505] text-zinc-100 selection:bg-green-500/30">
      <GridBackground />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <LuminaLogo size={32} />
              <span className="font-bold text-sm uppercase tracking-wider text-zinc-100">Lumina Clippers</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/viral"
                className="border border-white/[0.06] bg-transparent text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] transition-all"
              >
                Creator Login
              </Link>
              <Link
                href="/client"
                className="border border-white/[0.06] bg-transparent text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] transition-all"
              >
                Client Login
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-400/20 bg-green-400/[0.05] mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Internal Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            <span className="text-white">Submit Your </span>
            <span className="text-green-400">Clips</span>
          </h1>
          <p className="text-zinc-500 mt-4 text-lg max-w-xl mx-auto">
            Browse active campaigns, submit your content, and track your earnings — all in one place.
          </p>
        </section>

        {/* Open Campaigns Grid */}
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <h2 className="text-lg font-bold text-zinc-100 mb-6">Active Campaigns</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-white/[0.04] bg-white/[0.015] h-96 animate-pulse" />
              ))}
            </div>
          ) : openCampaigns.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500">No active campaigns right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {openCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </section>

        {/* See Completed Campaigns */}
        {!loading && completedCampaigns.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pb-20">
            <div className="text-center pt-6">
              <Link
                href="/completed"
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                See completed campaigns ({completedCampaigns.length})
              </Link>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-white/[0.06] py-8">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LuminaLogo size={20} />
              <span className="text-xs text-zinc-500">Lumina Clippers</span>
            </div>
            <p className="text-xs text-zinc-600">&copy; {new Date().getFullYear()} All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
