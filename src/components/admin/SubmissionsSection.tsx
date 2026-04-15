"use client"

import { useState } from "react"
import { type Submission } from "@/lib/api"
import { SubmissionGrid } from "./SubmissionGrid"
import { RefreshCw, Trash2, Edit } from "lucide-react"

interface SubmissionsSectionProps {
  submissions: Submission[]
  campaignId: number | null
  selectedPlatform: string
  onPlatformChange: (p: string) => void
  onRefreshMetrics: (ids: number[]) => void
  onDeleteSelected: (ids: number[]) => void
  onUpdateStatus: (ids: number[]) => void
  isViewer: boolean
  usViewersPct?: number
  ukViewersPct?: number | null
  includeUkViews?: boolean
  onUpdateUsViewersPct?: (id: number, pct: number) => void
  onUpdateUkViewersPct?: (id: number, pct: number) => void
}

const platforms = ["", "tiktok", "instagram", "youtube", "twitter"]

export function SubmissionsSection({
  submissions,
  campaignId,
  selectedPlatform,
  onPlatformChange,
  onRefreshMetrics,
  onDeleteSelected,
  onUpdateStatus,
  isViewer,
  usViewersPct,
  ukViewersPct,
  includeUkViews,
  onUpdateUsViewersPct,
  onUpdateUkViewersPct,
}: SubmissionsSectionProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Submissions ({submissions.length})
          </h2>
          <div className="flex gap-1">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => onPlatformChange(p)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                  selectedPlatform === p
                    ? "bg-green-400/20 text-green-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {p || "All"}
              </button>
            ))}
          </div>
        </div>

        {!isViewer && selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => onUpdateStatus(selectedIds)}
              className="flex items-center gap-1 border border-white/[0.06] text-zinc-300 hover:bg-white/[0.05] text-xs px-2.5 py-1.5 rounded-lg transition-all"
            >
              <Edit className="w-3 h-3" /> Status
            </button>
            <button
              onClick={() => onRefreshMetrics(selectedIds)}
              className="flex items-center gap-1 border border-white/[0.06] text-zinc-300 hover:bg-white/[0.05] text-xs px-2.5 py-1.5 rounded-lg transition-all"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
            <button
              onClick={() => onDeleteSelected(selectedIds)}
              className="flex items-center gap-1 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs px-2.5 py-1.5 rounded-lg transition-all"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p>No submissions found</p>
        </div>
      ) : (
        <SubmissionGrid
          submissions={submissions}
          campaignId={campaignId}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={setSelectedIds}
          usViewersPct={usViewersPct}
          ukViewersPct={ukViewersPct}
          includeUkViews={includeUkViews}
          onUpdateUsViewersPct={onUpdateUsViewersPct}
          onUpdateUkViewersPct={onUpdateUkViewersPct}
        />
      )}
    </div>
  )
}
