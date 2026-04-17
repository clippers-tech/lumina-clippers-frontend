"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, campaigns as campaignsApi, submissions as subsApi, type Campaign, type Submission } from "@/lib/api"
import { getToken, clearToken } from "@/lib/auth"
import { LuminaLogo } from "@/components/LuminaLogo"
import { formatNumber, formatCurrency, platformIcon, statusColor } from "@/lib/utils"
import { LogOut, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"

type CampaignWithSubs = {
  campaign: Campaign
  submissions: Submission[]
  stats: { total_views: number; total_interactions: number; est_revenue: number; total_submissions: number }
  expanded: boolean
}

export default function ClientDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [campaignData, setCampaignData] = useState<CampaignWithSubs[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push("/client"); return }
    loadData(token)
  }, [])

  const loadData = async (token: string) => {
    try {
      const me = await auth.me(token)
      if (me.role !== "viewer") {
        router.push("/0x8f3a9b2c/dashboard")
        return
      }
      setUserName(me.name)

      // Parse campaign_ids
      const ids = me.campaign_ids
        ? me.campaign_ids.split(",").map((id: string) => parseInt(id.trim())).filter((n: number) => !isNaN(n) && n > 0)
        : []

      // Fetch each campaign and its submissions
      const data: CampaignWithSubs[] = []
      for (const id of ids) {
        try {
          const campaign = await campaignsApi.get(token, id)
          const subsResp = await subsApi.list(token, id, { per_page: 200 })
          const subs = subsResp.items || []
          const visibleSubs = subs.filter((s: Submission) => s.status === "stats_verified" || s.status === "paid")

          // Calculate stats using client_cpm_rate
          const total_views = visibleSubs.reduce((sum: number, s: Submission) => sum + (s.views || 0), 0)
          const total_interactions = visibleSubs.reduce((sum: number, s: Submission) => sum + (s.interactions || 0), 0)
          const cpmRate = campaign.client_cpm_rate || campaign.cpm_rate
          const est_revenue = Math.round(total_views / 1000 * cpmRate * 100) / 100

          data.push({
            campaign,
            submissions: visibleSubs,
            stats: { total_views, total_interactions, est_revenue, total_submissions: visibleSubs.length },
            expanded: ids.length === 1,
          })
        } catch (err) {
          console.error(`Failed to load campaign ${id}:`, err)
        }
      }
      setCampaignData(data)
    } catch {
      clearToken()
      router.push("/client")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { clearToken(); router.push("/client") }

  const toggleExpand = (idx: number) => {
    setCampaignData(prev => prev.map((d, i) => i === idx ? { ...d, expanded: !d.expanded } : d))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b2518] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b2518] text-zinc-100 selection:bg-green-500/30">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-400/[0.02] rounded-full blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#0b2518]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <LuminaLogo size={28} />
              <span className="font-bold text-sm uppercase tracking-wider text-zinc-100 hidden sm:inline">
                Lumina Clippers
              </span>
            </div>
            <div className="flex items-center gap-3">
              {userName && (
                <span className="text-sm text-zinc-500 hidden sm:inline">{userName}</span>
              )}
              <button
                onClick={handleLogout}
                className="text-zinc-600 hover:text-zinc-300 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">
            Campaign Dashboard
          </p>
          <h1 className="text-2xl font-bold text-zinc-100">
            {userName ? `Welcome, ${userName}` : "Your Campaigns"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            View your campaign performance and results
          </p>
        </div>

        {campaignData.length === 0 ? (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-12 text-center">
            <p className="text-zinc-500 text-sm">No campaigns assigned to your account yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Contact your account manager to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaignData.map((item, idx) => (
              <div
                key={item.campaign.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden"
              >
                {/* Campaign header */}
                <button
                  onClick={() => toggleExpand(idx)}
                  className="w-full text-left"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {item.campaign.thumbnail_url && (
                          <img
                            src={item.campaign.thumbnail_url}
                            alt={item.campaign.name}
                            className="w-12 h-12 rounded-lg object-cover shrink-0 hidden sm:block"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-zinc-100">{item.campaign.name}</h2>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(item.campaign.status)}`}>
                              {item.campaign.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">{item.campaign.client_name}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-zinc-500">
                        {item.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {[
                        { label: "Submissions", value: formatNumber(item.stats.total_submissions) },
                        { label: "Total Views", value: formatNumber(item.stats.total_views) },
                        { label: "Interactions", value: formatNumber(item.stats.total_interactions) },
                        { label: "Est. Revenue", value: formatCurrency(item.stats.est_revenue), accent: true },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">{s.label}</p>
                          <p className={`text-base font-bold ${s.accent ? "text-green-400" : "text-zinc-100"}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>

                {/* Expanded submissions */}
                {item.expanded && (
                  <div className="border-t border-white/[0.06]">
                    {item.submissions.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-sm text-zinc-500">No verified submissions yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/[0.06]">
                              <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                                Platform
                              </th>
                              <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                                Post
                              </th>
                              <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                                Views
                              </th>
                              <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                                Interactions
                              </th>
                              <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                                Est. Revenue
                              </th>
                              <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                                Status
                              </th>
                              <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.submissions.map((sub) => {
                              const cpmRate = item.campaign.client_cpm_rate || item.campaign.cpm_rate
                              const subRevenue = Math.round(sub.views / 1000 * cpmRate * 100) / 100
                              return (
                                <tr
                                  key={sub.id}
                                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                                >
                                  <td className="px-5 py-3">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/[0.05] text-zinc-300 border border-white/[0.06]">
                                      {platformIcon(sub.platform)} {sub.platform}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 max-w-[200px]">
                                    <a
                                      href={sub.post_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-green-400 transition-colors truncate"
                                    >
                                      <span className="truncate">{sub.post_url}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <span className="text-sm font-mono text-zinc-100">{formatNumber(sub.views)}</span>
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <span className="text-sm font-mono text-zinc-100">{formatNumber(sub.interactions)}</span>
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <span className="text-sm font-mono text-green-400 font-semibold">{formatCurrency(subRevenue)}</span>
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(sub.status)}`}>
                                      {sub.status.replace(/_/g, " ")}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className="text-xs text-zinc-500">
                                      {new Date(sub.created_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
