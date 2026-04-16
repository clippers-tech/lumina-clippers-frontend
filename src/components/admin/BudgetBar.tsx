"use client"

import { formatCurrency } from "@/lib/utils"

interface BudgetBarProps {
  budgetUsed: number
  budgetTotal: number
  estRevenue: number
}

export function BudgetBar({ budgetUsed, budgetTotal, estRevenue }: BudgetBarProps) {
  const pct = budgetTotal > 0 ? Math.min((budgetUsed / budgetTotal) * 100, 100) : 0

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Budget Usage
        </p>
        <p className="text-xs text-zinc-400">
          {formatCurrency(budgetUsed)} / {formatCurrency(budgetTotal)}
          <span className="ml-3 text-green-400">Est. Revenue: {formatCurrency(estRevenue)}</span>
        </p>
      </div>
      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
