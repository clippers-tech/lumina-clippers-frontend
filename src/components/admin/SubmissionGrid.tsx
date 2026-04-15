"use client"

import { useState } from "react"
import Link from "next/link"
import { type Submission } from "@/lib/api"
import { formatNumber, formatCurrency, platformIcon } from "@/lib/utils"
import { StatusBadge } from "./StatusBadge"
import { ExternalLink, Check } from "lucide-react"

interface SubmissionGridProps {
  submissions: Submission[]
  campaignId: number | null
  selectedIds: number[]
  onToggleSelect: (id: number) => void
  onSelectAll: (ids: number[]) => void
  usViewersPct?: number
  ukViewersPct?: number | null
  includeUkViews?: boolean
  onUpdateUsViewersPct?: (id: number, pct: number) => void
  onUpdateUkViewersPct?: (id: number, pct: number) => void
}

export function SubmissionGrid({
  submissions,
  campaignId,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: SubmissionGridProps) {
  const allSelected = submissions.length > 0 && submissions.every((s) => selectedIds.includes(s.id))
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="w-10 px-3 py-3">
              <button
                onClick={() =>
                  allSelected
                    ? onSelectAll([])
                    : onSelectAll(submissions.map((s) => s.id))
                }
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  allSelected
                    ? "bg-lime-400 border-lime-400"
                    : "border-white/[0.15] hover:border-white/[0.3]"
                }`}
              >
                {allSelected && <Check className="w-3 h-3 text-black" />}
              </button>
            </th>
            <th className="text-left text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-3 py-3">Creator</th>
            <th className="text-left text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-3 py-3">Post</th>
            <th className="text-center text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-3 py-3">Platform</th>
            <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-3 py-3">Views</th>
            <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-3 py-3">Earnings</th>
            <th className="text-center text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-3 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub) => {
            const isSelected = selectedIds.includes(sub.id)
            return (
              <tr
                key={sub.id}
                className={`border-b border-white/[0.03] transition-colors ${
                  isSelected ? "bg-lime-400/5" : hoveredId === sub.id ? "bg-white/[0.02]" : ""
                }`}
                onMouseEnter={() => setHoveredId(sub.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <td className="px-3 py-3">
                  <button
                    onClick={() => onToggleSelect(sub.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-lime-400 border-lime-400"
                        : "border-white/[0.15] hover:border-white/[0.3]"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-black" />}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <div>
                    <p className="text-sm text-zinc-100 font-medium">{sub.clipper_name || sub.clipper_email}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">{sub.clipper_email}</p>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/campaigns/${campaignId}/submissions/${sub.id}`}
                      className="text-sm text-lime-400 hover:underline truncate max-w-[200px]"
                    >
                      #{sub.id}
                    </Link>
                    <a
                      href={sub.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-sm">{platformIcon(sub.platform)} {sub.platform}</span>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="text-sm font-mono text-zinc-100">{formatNumber(sub.views)}</span>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="text-sm font-mono text-lime-400">{formatCurrency(sub.est_earnings)}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <StatusBadge status={sub.status} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
