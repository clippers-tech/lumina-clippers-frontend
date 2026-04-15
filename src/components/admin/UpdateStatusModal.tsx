"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface UpdateStatusModalProps {
  selectedCount: number
  onConfirm: (status: string, notes: string) => void
  onClose: () => void
}

const statuses = ["awaiting_stats", "stats_verified", "paid", "rejected"]

export function UpdateStatusModal({ selectedCount, onConfirm, onClose }: UpdateStatusModalProps) {
  const [status, setStatus] = useState("stats_verified")
  const [notes, setNotes] = useState("")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] backdrop-blur-md w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-zinc-100">Update Status</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-400 mb-4">
          Updating {selectedCount} submission(s)
        </p>

        <div className="space-y-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 h-20 resize-none focus:outline-none focus:border-green-400/30"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-4 py-2 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(status, notes)}
            className="bg-green-400 text-black font-extrabold text-xs px-6 py-2 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
