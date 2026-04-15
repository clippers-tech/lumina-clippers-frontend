"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { viewer, type ViewerData } from "@/lib/api"
import { formatNumber, formatCurrency, platformIcon, statusColor } from "@/lib/utils"

export default function ViewerPage() {
  const params = useParams()
  const viewerToken = params.viewer_token as string

  const [data, setData] = useState<ViewerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")

  useEffect(() => {
    viewer.get(viewerToken)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [viewerToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">{error || "Not found"}</p>
        </div>
      </div>
    )
  }

  const { campaign, submissions } = data
  const platforms = campaign.accepted_platforms ? campaign.accepted_platforms.split(",").map((p) => p.trim()) : []
  const allSubmissionPlatforms = Array.from(new Set(submissions.map((s) => s.platform)))

  const filteredSubmissions = submissions.filter((s) => {
    if (platformFilter !== "all" && s.platform !== platformFilter) return false
    return true
  })

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-green-500/30">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-400/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="font-bold text-sm uppercase tracking-wider text-zinc-100">Campaign Results</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(campaign.status)}`}>
              {campaign.status}
            </span>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          {/* Campaign Header */}
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-6">
            <div className="flex items-start gap-4">
              {campaign.thumbnail_url && (
                <img
                  src={campaign.thumbnail_url}
                  alt={campaign.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-zinc-100">{campaign.name}</h1>
                <p className="text-xs text-zinc-500 mt-0.5">{campaign.client_name}</p>

                {platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {platforms.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/[0.05] text-zinc-300 border border-white/[0.06]"
                      >
                        {platformIcon(p.toLowerCase())} {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Submissions</span>
              <p className="text-xl font-extrabold text-zinc-100 mt-1">{formatNumber(campaign.total_submissions)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Views</span>
              <p className="text-xl font-extrabold text-zinc-100 mt-1">{formatNumber(campaign.total_views)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Interactions</span>
              <p className="text-xl font-extrabold text-zinc-100 mt-1">{formatNumber(campaign.total_interactions)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Est. Revenue</span>
              <p className="text-xl font-extrabold text-green-400 mt-1">{formatCurrency(campaign.est_revenue)}</p>
            </div>
          </div>

          {/* Submissions Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-300">Submissions</h2>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-400/30 transition-colors"
              >
                <option value="all">All Platforms</option>
                {allSubmissionPlatforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px]">
                <p className="text-zinc-500 text-sm">No submissions found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/[0.05] text-zinc-300 border border-white/[0.06]">
                        {platformIcon(sub.platform)} {sub.platform}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(sub.status)}`}>
                        {sub.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <a
                      href={sub.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-green-400 transition-colors truncate block"
                    >
                      {sub.post_url}
                    </a>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Views</span>
                        <p className="text-zinc-200 font-semibold">{formatNumber(sub.views)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Interactions</span>
                        <p className="text-zinc-200 font-semibold">{formatNumber(sub.interactions)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Earnings</span>
                        <p className="text-green-400 font-semibold">{formatCurrency(sub.est_earnings)}</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-zinc-600">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
