"use client"

import { useState } from "react"
import { type Campaign } from "@/lib/api"
import { X } from "lucide-react"

interface BulkAddModalProps {
  campaigns: Campaign[]
  selectedCampaignId: number | null
  onSubmit: (campaignId: number, items: { post_url: string; clipper_email?: string }[]) => Promise<{ added: number; skipped: number; results: { post_url: string; status: string; reason: string }[] }>
  onClose: () => void
}

export function BulkAddModal({ campaigns, selectedCampaignId, onSubmit, onClose }: BulkAddModalProps) {
  const [campaignId, setCampaignId] = useState<number>(selectedCampaignId || campaigns[0]?.id || 0)
  const [urls, setUrls] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ added: number; skipped: number; results: { post_url: string; status: string; reason: string }[] } | null>(null)

  const handleSubmit = async () => {
    const items = urls
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((url) => ({ post_url: url }))

    if (items.length === 0) return

    setLoading(true)
    try {
      const res = await onSubmit(campaignId, items)
      setResult(res)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bulk add failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] backdrop-blur-md w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-zinc-100">Bulk Add Submissions</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div>
            <p className="text-sm text-zinc-100 mb-2">
              Added: <span className="text-green-400">{result.added}</span> | Skipped: <span className="text-zinc-400">{result.skipped}</span>
            </p>
            {result.results.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.results.map((r, i) => (
                  <p key={i} className={`text-xs font-mono ${r.status === "added" ? "text-green-400" : "text-zinc-500"}`}>
                    {r.status}: {r.post_url} {r.reason && `(${r.reason})`}
                  </p>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-4 bg-green-400 text-black font-extrabold text-xs px-6 py-2 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)]"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(Number(e.target.value))}
              className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="Paste post URLs, one per line..."
              className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 h-40 resize-none font-mono focus:outline-none focus:border-green-400/30"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-4 py-2 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-400 text-black font-extrabold text-xs px-6 py-2 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Submissions"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
