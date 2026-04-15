"use client"

import { type Campaign } from "@/lib/api"
import { Download, RefreshCw, Send, Plus } from "lucide-react"

interface FilterBarProps {
  campaigns: Campaign[]
  selectedCampaignId: number | null
  onCampaignChange: (id: number | null) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  onSendUploadLinks: () => void
  onUpdateMetrics: () => void
  onDownloadCsv: () => void
  onBulkAdd: () => void
  isViewer: boolean
}

export function FilterBar({
  campaigns,
  selectedCampaignId,
  onCampaignChange,
  selectedStatus,
  onStatusChange,
  onSendUploadLinks,
  onUpdateMetrics,
  onDownloadCsv,
  onBulkAdd,
  isViewer,
}: FilterBarProps) {
  const statuses = ["", "awaiting_stats", "stats_verified", "paid", "rejected"]

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4 mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Campaign selector */}
        <select
          value={selectedCampaignId || ""}
          onChange={(e) => onCampaignChange(e.target.value ? Number(e.target.value) : null)}
          className="bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30 min-w-[200px]"
        >
          <option value="">Select Campaign</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30"
        >
          <option value="">All Statuses</option>
          {statuses.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        {/* Action buttons */}
        {!isViewer && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onBulkAdd}
              className="flex items-center gap-1.5 border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-3 py-2 rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Bulk Add
            </button>
            <button
              onClick={onSendUploadLinks}
              className="flex items-center gap-1.5 border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-3 py-2 rounded-lg transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Send Links
            </button>
            <button
              onClick={onUpdateMetrics}
              className="flex items-center gap-1.5 border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-3 py-2 rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update
            </button>
            <button
              onClick={onDownloadCsv}
              className="flex items-center gap-1.5 border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-3 py-2 rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
