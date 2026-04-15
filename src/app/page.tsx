"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { publicApi, type PublicCampaign } from "@/lib/api"
import { formatNumber, formatCurrency } from "@/lib/utils"
import { LuminaLogo } from "@/components/LuminaLogo"

/* ── Grid Background ─────────────────────────────────── */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-lime-400/[0.03] rounded-full blur-[120px]" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/[0.02] rounded-full blur-[100px]" />
    </div>
  )
}

/* ── Stat Pill ────────────────────────────────────────── */
function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02]">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
      <span className="text-sm font-bold text-zinc-100">{value}</span>
    </div>
  )
}

/* ── Campaign Card ────────────────────────────────────── */
function CampaignCard({ campaign }: { campaign: PublicCampaign }) {
  const budgetPct = campaign.budget_total > 0 ? Math.min(100, (campaign.budget_used / campaign.budget_total) * 100) : 0

  return (
    <div className="group rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden transition-all hover:border-white/[0.08] hover:bg-white/[0.025]">
      {/* Thumbnail */}
      {campaign.thumbnail_url && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={campaign.thumbnail_url}
            alt={campaign.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${campaign.status === "open" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-400"}`}>
              {campaign.status}
            </span>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white transition-colors">{campaign.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{campaign.client_name}</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">CPM</span>
            <p className="text-zinc-200 font-semibold">{formatCurrency(campaign.cpm_rate)}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Max Payout</span>
            <p className="text-zinc-200 font-semibold">{formatCurrency(campaign.max_payout)}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Clips</span>
            <p className="text-zinc-200 font-semibold">{formatNumber(campaign.total_submissions)}</p>
          </div>
        </div>

        {/* Budget bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Budget</span>
            <span className="text-[10px] text-zinc-500">{Math.round(budgetPct)}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-lime-400 transition-all duration-500"
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>

        {/* Submit link */}
        {campaign.status === "open" && (
          <Link
            href={`/c/${campaign.slug}`}
            className="block w-full text-center bg-lime-400 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(163,230,53,0.4)] hover:bg-lime-300 transition-all"
          >
            Submit Clip
          </Link>
        )}
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────── */
export default function HomePage() {
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.campaigns()
      .then((data) => setCampaigns(data.filter((c) => c.status === "open")))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalSubmissions = campaigns.reduce((sum, c) => sum + c.total_submissions, 0)
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget_total, 0)

  return (
    <div className="relative min-h-screen bg-[#050505] text-zinc-100 selection:bg-lime-500/30">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lime-400/20 bg-lime-400/[0.05] mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-lime-400">Internal Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            <span className="text-white">Submit Your </span>
            <span className="text-lime-400">Clips</span>
          </h1>
          <p className="text-zinc-500 mt-4 text-lg max-w-xl mx-auto">
            Browse active campaigns, submit your content, and track your earnings — all in one place.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            <StatPill label="Campaigns" value={String(campaigns.length)} />
            <StatPill label="Submissions" value={formatNumber(totalSubmissions)} />
            <StatPill label="Total Budget" value={formatCurrency(totalBudget)} />
          </div>
        </section>

        {/* Campaigns Grid */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-zinc-100">Active Campaigns</h2>
            <Link
              href="/completed"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              View Completed &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-white/[0.04] bg-white/[0.015] h-72 animate-pulse" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500">No active campaigns right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </section>

        {/* How It Works */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <h2 className="text-lg font-bold text-zinc-100 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Pick a Campaign", desc: "Browse active campaigns and find one that fits your content style." },
              { step: "02", title: "Submit Your Clip", desc: "Paste your post URL and we'll start tracking views automatically." },
              { step: "03", title: "Get Paid", desc: "Earn based on verified views at the campaign's CPM rate." },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-6 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-lime-400/10 text-lime-400 font-extrabold text-sm mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-sm text-zinc-100 mb-1">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

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
