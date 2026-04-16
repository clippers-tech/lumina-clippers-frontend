"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { publicApi, type PublicCampaign } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { LuminaLogo } from "@/components/LuminaLogo"

/* ── Aurora Background (matches Lumina Clippers brand) ─── */
function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base dark green — lifted to match client's richer green tone */}
      <div className="absolute inset-0 bg-[#0b2518]" />
      {/* Top aurora glow — large, bright, prominent */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[1400px] h-[900px] bg-[radial-gradient(ellipse_at_center,rgba(74,222,128,0.22)_0%,rgba(74,222,128,0.10)_35%,transparent_65%)]" />
      {/* Secondary glow - right */}
      <div className="absolute top-[10%] right-[-10%] w-[700px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(74,222,128,0.12)_0%,transparent_55%)]" />
      {/* Secondary glow - left */}
      <div className="absolute top-[5%] left-[-5%] w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(74,222,128,0.10)_0%,transparent_55%)]" />
      {/* Mid-page glow for campaign area */}
      <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(74,222,128,0.08)_0%,transparent_55%)]" />
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
    </div>
  )
}

/* ── Money Counter ────────────────────────────────────── */
function MoneyCounter() {
  const START = 105323
  const RATE = 0.002 // 0.2%
  const INTERVAL = 10000 // 10 seconds
  const [amount, setAmount] = useState(START)
  const amountRef = useRef(START)

  useEffect(() => {
    const timer = setInterval(() => {
      amountRef.current = amountRef.current * (1 + RATE)
      setAmount(amountRef.current)
    }, INTERVAL)
    return () => clearInterval(timer)
  }, [])

  const formatted = amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className="text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-400/70 mb-3">
        Total Paid Out
      </p>
      <div className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white tabular-nums transition-all duration-700">
        {formatted}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-green-400/60 font-medium">Live counter</span>
      </div>
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
  bg: "from-green-900/80 via-green-800/70 to-green-950/80",
  accent: "text-green-300",
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b2518] via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider bg-green-500/30 text-green-300 backdrop-blur-sm border border-green-400/20">
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
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[size:20px_20px]" />
      </div>
      <div className="absolute top-3 left-3 z-10">
        <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider bg-green-500/30 text-green-300 backdrop-blur-sm border border-green-400/20">
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
    <div className="group rounded-xl border border-green-400/[0.08] bg-[#0d2e1c]/70 backdrop-blur-sm overflow-hidden transition-all hover:border-green-400/20 hover:shadow-[0_0_40px_-10px_rgba(74,222,128,0.15)]">
      <CampaignThumbnail campaign={campaign} />

      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-extrabold text-base text-zinc-100 group-hover:text-white transition-colors">
            {campaign.name} Campaign
          </h3>
          {campaign.description && (
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{campaign.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-green-400/[0.08] bg-green-400/[0.03] text-xs">
            <span className="text-zinc-500 font-medium mr-1.5">CPM</span>
            <span className="text-zinc-200 font-bold">{formatCurrency(campaign.cpm_rate)} / 1k views</span>
          </span>
          {campaign.max_payout > 0 && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-green-400/[0.08] bg-green-400/[0.03] text-xs">
              <span className="text-zinc-500 font-medium mr-1.5">Max payout</span>
              <span className="text-zinc-200 font-bold">{formatCurrency(campaign.max_payout)}</span>
            </span>
          )}
        </div>

        {campaign.budget_total > 0 && (
          <div className="rounded-lg border border-green-400/[0.06] bg-green-400/[0.02] p-3">
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

        {campaign.status === "open" && (
          <Link
            href={`/c/${campaign.slug}`}
            className="block w-full text-center bg-green-400 text-black font-extrabold text-sm px-6 py-3 rounded-lg uppercase tracking-wide shadow-[0_0_30px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all"
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
    <div className="relative min-h-screen text-zinc-100 selection:bg-green-500/30">
      <AuroraBackground />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-green-400/[0.06] bg-[#0b2518]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <LuminaLogo size={32} />
              <span className="font-bold text-sm uppercase tracking-wider text-zinc-100">Lumina Clippers</span>
            </Link>
            <Link
              href="/viral"
              className="bg-green-400 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all"
            >
              Claim Payouts
            </Link>
          </div>
        </nav>

        {/* Hero — Money Counter */}
        <section className="max-w-6xl mx-auto px-4 pt-24 pb-20">
          <MoneyCounter />
        </section>

        {/* Open Campaigns Grid */}
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <h2 className="text-lg font-bold text-zinc-100 mb-6">Active Campaigns</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-green-400/[0.06] bg-[#0d2e1c]/50 h-96 animate-pulse" />
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
          <section className="max-w-5xl mx-auto px-4 pb-16">
            <div className="text-center pt-6">
              <Link
                href="/completed"
                className="text-sm text-zinc-500 hover:text-green-400/80 transition-colors"
              >
                See completed campaigns ({completedCampaigns.length})
              </Link>
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <h2 className="text-lg font-bold text-zinc-100 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                title: "Read",
                desc: "Read the reward requirements so you can make your clip.",
              },
              {
                step: "02",
                title: "Upload",
                desc: "Upload your clip & upload video of analytics.",
              },
              {
                step: "03",
                title: "Get Paid",
                desc: "Earn based on verified views at the campaign\u2019s CPM rate.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-green-400/[0.08] bg-[#0d2e1c]/50 backdrop-blur-sm p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-400/10 text-green-400 font-extrabold text-sm mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-sm text-zinc-100 mb-1">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-green-400/[0.06] py-8">
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
