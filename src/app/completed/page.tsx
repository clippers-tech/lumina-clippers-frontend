"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { publicApi, type PublicCampaign } from "@/lib/api"
import { formatNumber, formatCurrency } from "@/lib/utils"
import { LuminaLogo } from "@/components/LuminaLogo"

/* ── Default Thumbnail ────────────────────────────────── */
function CompletedThumbnail({ campaign }: { campaign: PublicCampaign }) {
  if (campaign.thumbnail_url) {
    return (
      <div className="relative h-36 overflow-hidden">
        <img src={campaign.thumbnail_url} alt={campaign.name} className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-500/20 text-zinc-400">
            Completed
          </span>
        </div>
      </div>
    )
  }

  const initials = campaign.name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase()

  return (
    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-zinc-800/60 via-zinc-700/40 to-zinc-900/60 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[size:16px_16px]" />
      </div>
      <div className="absolute bottom-3 left-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-500/20 text-zinc-400">
          Completed
        </span>
      </div>
      <div className="text-3xl font-black tracking-wider text-zinc-500/40 mb-1">{initials}</div>
      <p className="text-white/40 font-bold text-xs uppercase tracking-wide text-center max-w-[180px] leading-tight">
        {campaign.name}
      </p>
    </div>
  )
}

/* ── Completed Campaign Card ──────────────────────────── */
function CompletedCampaignCard({ campaign }: { campaign: PublicCampaign }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden">
      <CompletedThumbnail campaign={campaign} />

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-sm text-zinc-100">{campaign.name}</h3>
          {campaign.description && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{campaign.description}</p>
          )}
        </div>

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
      .then((data) => setCampaigns(data.filter((c) => c.status === "completed" || c.status === "closed")))
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
            <Link href="/" className="flex items-center gap-2.5">
              <LuminaLogo size={32} />
              <span className="font-bold text-sm uppercase tracking-wider text-zinc-100">Lumina Clippers</span>
            </Link>
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              &larr; Active Campaigns
            </Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-zinc-100">Completed Campaigns</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {campaigns.length > 0 ? `${campaigns.length} past campaigns` : "Past campaigns that are no longer active"}
            </p>
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
