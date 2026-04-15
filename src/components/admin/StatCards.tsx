"use client"

import { formatNumber, formatCurrency } from "@/lib/utils"

interface StatCardsProps {
  totalSubmissions: number
  verifiedSubmissions: number
  totalViews: number
  totalInteractions: number
  estRevenue: number
}

export function StatCards({
  totalSubmissions,
  verifiedSubmissions,
  totalViews,
  totalInteractions,
  estRevenue,
}: StatCardsProps) {
  const stats = [
    { label: "Total Submissions", value: formatNumber(totalSubmissions) },
    { label: "Verified", value: formatNumber(verifiedSubmissions) },
    { label: "Total Views", value: formatNumber(totalViews) },
    { label: "Interactions", value: formatNumber(totalInteractions) },
    { label: "Est. Revenue", value: formatCurrency(estRevenue), accent: true },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4 transition-all hover:bg-white/[0.03] hover:border-white/[0.08]"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
            {s.label}
          </p>
          <p className={`text-lg font-bold ${s.accent ? "text-green-400" : "text-zinc-100"}`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  )
}
