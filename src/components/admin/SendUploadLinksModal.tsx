"use client"

import { useState } from "react"
import { type Submission } from "@/lib/api"
import { X, Check } from "lucide-react"

interface SendUploadLinksModalProps {
  submissions: Submission[]
  onSend: (ids: number[]) => void
  onClose: () => void
  sending: boolean
}

export function SendUploadLinksModal({ submissions, onSend, onClose, sending }: SendUploadLinksModalProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(
    submissions.filter((s) => s.status === "awaiting_stats").map((s) => s.id)
  )

  const toggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] backdrop-blur-md w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-zinc-100">Send Upload Links</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-400 mb-4">
          Select submissions to send upload links to:
        </p>

        <div className="space-y-2 mb-4">
          {submissions.map((sub) => (
            <button
              key={sub.id}
              onClick={() => toggle(sub.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                selectedIds.includes(sub.id)
                  ? "border-lime-400/20 bg-lime-400/5"
                  : "border-white/[0.04] hover:bg-white/[0.02]"
              }`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                selectedIds.includes(sub.id) ? "bg-lime-400 border-lime-400" : "border-white/[0.15]"
              }`}>
                {selectedIds.includes(sub.id) && <Check className="w-3 h-3 text-black" />}
              </div>
              <div>
                <p className="text-sm text-zinc-100">{sub.clipper_name || sub.clipper_email}</p>
                <p className="text-[11px] text-zinc-500">{sub.post_url}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-4 py-2 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSend(selectedIds)}
            disabled={sending || selectedIds.length === 0}
            className="bg-lime-400 text-black font-extrabold text-xs px-6 py-2 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(163,230,53,0.4)] hover:bg-lime-300 transition-all disabled:opacity-50"
          >
            {sending ? "Sending..." : `Send to ${selectedIds.length}`}
          </button>
        </div>
      </div>
    </div>
  )
}
