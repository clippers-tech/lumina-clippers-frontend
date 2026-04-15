"use client"

import { formatNumber, formatCurrency } from "@/lib/utils"

interface StatsBarProps {
  stats: { label: string; value: string | number; isCurrency?: boolean }[]
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="flex items-center gap-6 py-3">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {s.label}
          </span>
          <span className="text-sm font-mono text-zinc-100">
            {s.isCurrency ? formatCurrency(Number(s.value)) : formatNumber(Number(s.value))}
          </span>
        </div>
      ))}
    </div>
  )
}
