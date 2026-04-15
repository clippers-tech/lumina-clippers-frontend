"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { publicApi, type PublicCampaign } from "@/lib/api"
import { formatNumber, formatCurrency, platformIcon } from "@/lib/utils"

/* ── Completed Campaign Card ──────────────────────────── */
function CompletedCampaignCard({ campaign }: { campaign: PublicCampaign }) {
  const budgetPct = campaign.budget_total > 0 ? Math.min(100, (campaign.budget_used / campaign.budget_total) * 100) : 0
  const platforms = campaign.accepted_platforms ? campaign.accepted_platforms.split(",").map((p) => p.trim()) : []

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden">
      {campaign.thumbnail_url && (
        <div className="relative h-36 overflow-hidden">
          <img
            src={campaign.thumbnail_url}
            alt={campaign.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400">
              {campaign.status}
            </span>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-sm text-zinc-100">{campaign.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{campaign.client_name}</p>
        </div>

        {/* Platforms */}
        {platforms.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {platforms.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/[0.04] text-zinc-400 border border-white/[0.04]"
              >
                {platformIcon(p.toLowerCase())} {p}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">CPM</span>
            <p className="text-zinc-300 font-semibold">{formatCurrency(campaign.cpm_rate)}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Max Pay</span>
            <p className="text-zinc-300 font-semibold">{formatCurrency(campaign.max_payout)}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Clips</span>
            <p className="text-zinc-300 font-semibold">{formatNumber(campaign.total_submissions)}</p>
          </div>
        </div>

        {/* Budget bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Budget Used</span>
            <span className="text-[10px] text-zinc-500">{Math.round(budgetPct)}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-zinc-500 transition-all duration-500"
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────── */
export default function CompletedCampaignsPage() {
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.campaigns()
      .then((data) => setCampaigns(data.filter((c) => c.status === "closed" || c.status === "archived")))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-green-500/30">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-400/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              &larr; Active Campaigns
            </Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-zinc-100">Completed Campaigns</h1>
            <p className="text-sm text-zinc-500 mt-1">Past campaigns that are no longer active</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-white/[0.04] bg-white/[0.015] h-72 animate-pulse" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 text-sm">No completed campaigns yet.</p>
              <Link
                href="/"
                className="inline-block mt-3 text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                View active campaigns &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <CompletedCampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
