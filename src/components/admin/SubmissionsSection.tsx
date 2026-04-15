"use client"

import { useState } from "react"
import { type Submission } from "@/lib/api"
import { SubmissionGrid } from "./SubmissionGrid"
import { SubmissionCard } from "./SubmissionCard"
import { RefreshCw, Trash2, Edit, LayoutGrid, List, Search } from "lucide-react"

const PAGE_SIZE = 25

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Filter by search
  const filtered = submissions.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.clipper_name?.toLowerCase().includes(q) ||
      s.clipper_email.toLowerCase().includes(q) ||
      s.post_url.toLowerCase().includes(q)
    )
  })

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selectPage = () => {
    const ids = paginated.map((s) => s.id)
    const allSelected = ids.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])))
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Submissions ({filtered.length})
            </h2>
            <div className="flex gap-1">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => { onPlatformChange(p); setPage(1) }}
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

          {/* View toggle */}
          <div className="flex border border-white/[0.06] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "grid" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "list" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <List className="w-3 h-3" />
              List
            </button>
          </div>
        </div>

        {/* Search + bulk actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              type="text"
              placeholder="Search creator, email, URL..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-green-400/20 transition-colors"
            />
          </div>

          {!isViewer && (
            <div className="flex items-center gap-2 ml-auto">
              {selectedIds.length > 0 && (
                <>
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
                </>
              )}
              <button
                onClick={selectPage}
                className="text-[10px] text-green-400 hover:text-green-300 transition-colors font-medium"
              >
                Select page
              </button>
            </div>
          )}
        </div>

        {/* Pagination info */}
        <p className="text-[10px] text-zinc-600 mt-2">
          Showing {paginated.length} of {filtered.length} submissions
          {totalPages > 1 && ` · page ${page} of ${totalPages}`}
        </p>
      </div>

      {/* Content */}
      {paginated.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p>No submissions found</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {paginated.map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              isSelected={selectedIds.includes(sub.id)}
              onToggleSelect={handleToggleSelect}
              hideCheckbox={isViewer}
              usViewersPct={usViewersPct}
              ukViewersPct={ukViewersPct}
              includeUkViews={includeUkViews}
              onUpdateUsViewersPct={onUpdateUsViewersPct}
              onUpdateUkViewersPct={onUpdateUkViewersPct}
              isAdmin={!isViewer}
            />
          ))}
        </div>
      ) : (
        <SubmissionGrid
          submissions={paginated}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-4 border-t border-white/[0.04]">
          <button
            onClick={() => setPage(1)}
            disabled={page <= 1}
            className="text-xs px-2 py-1 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
          >
            First
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs px-2 py-1 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
          >
            Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 7) {
              pageNum = i + 1
            } else if (page <= 4) {
              pageNum = i + 1
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i
            } else {
              pageNum = page - 3 + i
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                  pageNum === page
                    ? "bg-green-400 text-black font-bold"
                    : "text-zinc-500 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {pageNum}
              </button>
            )
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs px-2 py-1 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
          >
            Next
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            className="text-xs px-2 py-1 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
          >
            Last
          </button>
        </div>
      )}
    </div>
  )
}
