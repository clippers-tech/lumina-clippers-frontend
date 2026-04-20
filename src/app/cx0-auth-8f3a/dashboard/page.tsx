"use client"

import { useEffect, useState, useCallback } from "react"
import { getToken } from "@/lib/auth"
import {
  campaigns as campaignsApi,
  submissions as submissionsApi,
  type Campaign,
  type CampaignStats,
  type Submission,
} from "@/lib/api"
import { DashboardHeader } from "@/components/admin/DashboardHeader"
import { FilterBar } from "@/components/admin/FilterBar"
import { StatCards } from "@/components/admin/StatCards"
import { SubmissionsSection } from "@/components/admin/SubmissionsSection"
import { ClientTabs } from "@/components/client/ClientTabs"

export default function ClientDashboardPage() {
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState("")
  const [platformFilter, setPlatformFilter] = useState("")
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    campaignsApi
      .list(token)
      .then((data) => {
        setAllCampaigns(data)
        if (data.length > 0) {
          setSelectedCampaignId(data[0].id)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedCampaignId) {
      setStats(null)
      setSubmissions([])
      return
    }
    const token = getToken()
    if (!token) return

    // Fetch stats and override est_revenue with client_cpm_rate
    campaignsApi.stats(token, selectedCampaignId).then((s) => {
      const campaign = allCampaigns.find((c) => c.id === selectedCampaignId)
      if (campaign) {
        const clientRate = campaign.client_cpm_rate || campaign.cpm_rate
        s.est_revenue = Math.round(s.total_views / 1000 * clientRate * 100) / 100
      }
      setStats(s)
    }).catch(console.error)

    const params: { status?: string; platform?: string } = {}
    if (statusFilter) params.status = statusFilter
    if (platformFilter) params.platform = platformFilter

    submissionsApi
      .list(token, selectedCampaignId, { ...params, per_page: 200 })
      .then((res) => {
        const campaign = allCampaigns.find((c) => c.id === selectedCampaignId)
        const clientRate = campaign?.client_cpm_rate || campaign?.cpm_rate || 0
        const adjusted = res.items.map((sub: Submission) => ({
          ...sub,
          est_earnings: Math.round((sub.views || 0) / 1000 * clientRate * 100) / 100,
        }))
        setSubmissions(adjusted)
      })
      .catch(console.error)
  }, [selectedCampaignId, statusFilter, platformFilter, allCampaigns])

  // No-op handlers for read-only mode (FilterBar hides buttons when isViewer=true)
  const noop = useCallback(() => {}, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <DashboardHeader />

      <div className="mt-6 mb-6">
        <ClientTabs />
      </div>

      <FilterBar
        campaigns={allCampaigns}
        selectedCampaignId={selectedCampaignId}
        onCampaignChange={setSelectedCampaignId}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
        onUpdateMetrics={noop}
        isViewer={true}
      />

      {stats && (
        <StatCards
          totalSubmissions={stats.total_submissions}
          verifiedSubmissions={stats.submissions_with_stats}
          totalViews={stats.total_views}
          totalInteractions={stats.total_interactions}
          estRevenue={0}
          hideRevenue
        />
      )}

      <SubmissionsSection
        submissions={submissions}
        campaignId={selectedCampaignId}
        selectedPlatform={platformFilter}
        onPlatformChange={setPlatformFilter}
        onRefreshMetrics={noop}
        onDeleteSelected={noop}
        onUpdateStatus={noop}
        isViewer={true}
        usViewersPct={allCampaigns.find((c) => c.id === selectedCampaignId)?.us_viewers_pct}
        ukViewersPct={allCampaigns.find((c) => c.id === selectedCampaignId)?.uk_viewers_pct}
        includeUkViews={allCampaigns.find((c) => c.id === selectedCampaignId)?.include_uk_views || false}
      />
    </div>
  )
}
