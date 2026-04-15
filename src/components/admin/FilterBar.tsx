"use client"

import { useState, useRef, useEffect } from "react"
import { type Campaign } from "@/lib/api"
import { Download, RefreshCw, Send, Plus, ChevronDown, Check } from "lucide-react"

/* ── Custom Dropdown ───────────────────────────────────── */
interface DropdownOption {
  value: string
  label: string
}

function Dropdown({
  options,
  value,
  onChange,
  placeholder,
  minWidth = "200px",
}: {
  options: DropdownOption[]
  value: string
  onChange: (val: string) => void
  placeholder: string
  minWidth?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative" style={{ minWidth }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 bg-white/[0.05] border border-white/[0.08] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors hover:bg-white/[0.08]"
      >
        <span className={selected ? "text-zinc-100" : "text-zinc-500"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-white/[0.1] bg-[#1a1a1a] shadow-2xl shadow-black/60">
          {/* Placeholder / clear option */}
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false) }}
            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
              !value ? "text-green-400 bg-green-400/[0.08]" : "text-zinc-500 hover:bg-white/[0.05]"
            }`}
          >
            {placeholder}
          </button>

          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm transition-colors ${
                opt.value === value
                  ? "text-green-400 bg-green-400/[0.08]"
                  : "text-zinc-300 hover:bg-white/[0.05] hover:text-zinc-100"
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && <Check className="w-3.5 h-3.5 text-green-400 shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Filter Bar ────────────────────────────────────────── */
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
  const statuses = ["awaiting_stats", "stats_verified", "paid", "rejected"]

  const campaignOptions: DropdownOption[] = campaigns.map((c) => ({
    value: String(c.id),
    label: c.name,
  }))

  const statusOptions: DropdownOption[] = statuses.map((s) => ({
    value: s,
    label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }))

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4 mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Campaign selector */}
        <Dropdown
          options={campaignOptions}
          value={selectedCampaignId ? String(selectedCampaignId) : ""}
          onChange={(val) => onCampaignChange(val ? Number(val) : null)}
          placeholder="Select Campaign"
          minWidth="220px"
        />

        {/* Status filter */}
        <Dropdown
          options={statusOptions}
          value={selectedStatus}
          onChange={onStatusChange}
          placeholder="All Statuses"
          minWidth="160px"
        />

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
