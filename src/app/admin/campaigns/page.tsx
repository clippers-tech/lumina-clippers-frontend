"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { getToken } from "@/lib/auth"
import {
  campaigns as campaignsApi,
  submissions as submissionsApi,
  type Campaign,
} from "@/lib/api"
import { AdminTabs } from "@/components/admin/AdminTabs"
import { AdminGuard } from "@/components/admin/AdminGuard"
import { formatCurrency } from "@/lib/utils"
import { Plus, FolderOpen, Pencil, Trash2, Copy } from "lucide-react"

interface CampaignRow extends Campaign {
  submissionCount?: number
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    campaignsApi
      .list(token)
      .then(async (data) => {
        const withCounts = await Promise.all(
          data.map(async (c) => {
            try {
              const subs = await submissionsApi.list(token, c.id, { per_page: 1 })
              return { ...c, submissionCount: subs.total }
            } catch {
              return { ...c, submissionCount: 0 }
            }
          })
        )
        setCampaigns(withCounts)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleToggleStatus = useCallback(async (campaign: CampaignRow) => {
    const token = getToken()
    if (!token) return
    const newStatus = campaign.status === "open" ? "closed" : "open"
    try {
      const updated = await campaignsApi.update(token, campaign.id, { status: newStatus })
      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
    } catch (err) { console.error(err) }
  }, [])

  const handleDuplicate = useCallback(async (id: number) => {
    const token = getToken()
    if (!token) return
    try {
      const dup = await campaignsApi.duplicate(token, id)
      setCampaigns((prev) => [{ ...dup, submissionCount: 0 }, ...prev])
    } catch (err) { console.error(err) }
  }, [])

  const handleDelete = useCallback(async (id: number, name: string) => {
    if (!confirm(`Delete campaign "${name}"? This cannot be undone.`)) return
    const token = getToken()
    if (!token) return
    try {
      await campaignsApi.delete(token, id)
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
    } catch (err) { console.error(err) }
  }, [])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
  }

  const statusDot = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-400",
      closed: "bg-amber-400",
      draft: "bg-gray-400",
      archived: "bg-gray-500",
    }
    return colors[status] || "bg-gray-400"
  }

  return (
    <AdminGuard>
      <div>
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">Admin Panel</p>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Campaign Management</h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">Create and manage campaigns</p>
          </div>
          <Link
            href="/admin/campaigns/new"
            className="flex items-center gap-1.5 bg-green-400 text-black text-xs font-extrabold px-5 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>

        <div className="mt-6 mb-6">
          <AdminTabs />
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">All Campaigns</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <p className="text-lg">No campaigns yet</p>
              <p className="text-sm mt-1">Create your first campaign to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">Campaign</th>
                    <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">Slug</th>
                    <th className="text-center text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">Submissions</th>
                    <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">Created</th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${statusDot(c.status)}`} />
                          <div className="min-w-0">
                            <Link href={`/admin/campaigns/${c.id}`} className="text-sm font-semibold text-zinc-100 hover:text-green-400 transition-colors">
                              {c.name}
                            </Link>
                            {c.client_email && <p className="text-[11px] text-zinc-600 mt-0.5">by {c.client_email}</p>}
                            <p className="text-[11px] text-zinc-600">
                              CPM: {formatCurrency(c.cpm_rate)}
                              {c.max_payout > 0 && ` · Max: ${formatCurrency(c.max_payout)}`}
                              {c.budget_total > 0 && ` · Budget: ${formatCurrency(c.budget_total)}`}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {c.thumbnail_url && <a href={c.thumbnail_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-green-400 hover:underline">Thumbnail ↗</a>}
                              {c.brief_url && <a href={c.brief_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-green-400 hover:underline">Requirements ↗</a>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block bg-green-400/10 text-green-400 text-xs font-mono px-2.5 py-1 rounded">{c.slug}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-medium text-zinc-100">{c.submissionCount ?? 0}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-zinc-500">{formatDate(c.created_at)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/campaigns/${c.id}`} title="View" className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-all">
                            <FolderOpen className="w-3.5 h-3.5" />
                          </Link>
                          <Link href={`/admin/campaigns/${c.id}/settings`} title="Edit" className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-all">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => handleDuplicate(c.id)} title="Duplicate" className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-all">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleToggleStatus(c)} title={c.status === "open" ? "Close" : "Reopen"} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-all">
                            {c.status === "open" ? "Close" : "Reopen"}
                          </button>
                          <button onClick={() => handleDelete(c.id, c.name)} title="Delete" className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  )
}
