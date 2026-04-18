"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { getToken } from "@/lib/auth"
import {
  campaigns as campaignsApi,
  submissions as submissionsApi,
  type Campaign,
  type CampaignStats,
  type Submission,
} from "@/lib/api"
import { useScrapeProgress } from "@/lib/scrape-context"
import { DashboardHeader } from "@/components/admin/DashboardHeader"
import { FilterBar } from "@/components/admin/FilterBar"
import { BudgetBar } from "@/components/admin/BudgetBar"
import { StatCards } from "@/components/admin/StatCards"
import { SubmissionsSection } from "@/components/admin/SubmissionsSection"
import { UpdateStatusModal } from "@/components/admin/UpdateStatusModal"

import { useUser } from "@/lib/user-context"
import { AdminTabs } from "@/components/admin/AdminTabs"
import { ConfirmModal } from "@/components/ui/ConfirmModal"

export default function DashboardPage() {
  const { isViewer } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: number[] } | null>(null)
  const [statusFilter, setStatusFilter] = useState("")
  const [platformFilter, setPlatformFilter] = useState("")
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusModalIds, setStatusModalIds] = useState<number[]>([])
  const [showStatusModal, setShowStatusModal] = useState(false)


  useEffect(() => {
    const token = getToken()
    if (!token) return
    const initialCampaignParam = searchParams.get("campaign")
    campaignsApi
      .list(token)
      .then((data) => {
        setAllCampaigns(data)
        if (initialCampaignParam) {
          const found = data.find((c) => c.id === parseInt(initialCampaignParam))
          if (found) {
            setSelectedCampaignId(found.id)
          } else if (data.length > 0) {
            setSelectedCampaignId(data[0].id)
          }
        } else if (data.length > 0) {
          setSelectedCampaignId(data[0].id)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [searchParams])

  useEffect(() => {
    if (!selectedCampaignId) {
      setStats(null)
      setSubmissions([])
      return
    }
    const token = getToken()
    if (!token) return

    campaignsApi.stats(token, selectedCampaignId).then(setStats).catch(console.error)

    const params: { status?: string; platform?: string } = {}
    if (statusFilter) params.status = statusFilter
    if (platformFilter) params.platform = platformFilter

    submissionsApi
      .list(token, selectedCampaignId, { ...params, per_page: 200 })
      .then((res) => setSubmissions(res.items))
      .catch(console.error)
  }, [selectedCampaignId, statusFilter, platformFilter])

  const { startScrape, isRunning: isScraping, progress } = useScrapeProgress()

  // Auto-refresh data when scrape completes
  useEffect(() => {
    if (progress?.status === "complete" && selectedCampaignId) {
      const token = getToken()
      if (!token) return
      campaignsApi.stats(token, selectedCampaignId).then(setStats).catch(console.error)
      const params: { status?: string; platform?: string } = {}
      if (statusFilter) params.status = statusFilter
      if (platformFilter) params.platform = platformFilter
      submissionsApi
        .list(token, selectedCampaignId, { ...params, per_page: 200 })
        .then((res) => setSubmissions(res.items))
        .catch(console.error)
    }
  }, [progress?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateMetrics = useCallback(async () => {
    if (!selectedCampaignId || isScraping) return
    const campaign = allCampaigns.find((c) => c.id === selectedCampaignId)
    await startScrape(selectedCampaignId, campaign?.name || "Campaign")
  }, [selectedCampaignId, allCampaigns, startScrape, isScraping])

  const handleRefreshMetrics = useCallback((ids: number[]) => {
    const token = getToken()
    if (!token) return
    ids.forEach((id) => {
      submissionsApi.scrape(token, id).catch(console.error)
    })
  }, [])

  const handleDeleteSelected = useCallback((ids: number[]) => {
    if (ids.length === 0) return
    setDeleteConfirm({ ids })
  }, [])

  const confirmDeleteSelected = useCallback(async () => {
    if (!deleteConfirm) return
    const { ids } = deleteConfirm
    setDeleteConfirm(null)
    const token = getToken()
    if (!token) return
    Promise.all(ids.map((id) => submissionsApi.delete(token, id)))
      .then(() => {
        setSubmissions((prev) => prev.filter((s) => !ids.includes(s.id)))
      })
      .catch(console.error)
  }, [deleteConfirm])

  const handleUpdateStatus = useCallback((ids: number[]) => {
    if (ids.length === 0) return
    setStatusModalIds(ids)
    setShowStatusModal(true)
  }, [])

  const handleConfirmStatusUpdate = useCallback(async (status: string, notes: string) => {
    const token = getToken()
    if (!token) return
    try {
      await submissionsApi.bulkStatus(token, statusModalIds, status, notes)
      setSubmissions((prev) =>
        prev.map((s) =>
          statusModalIds.includes(s.id) ? { ...s, status, notes: notes ? (s.notes ? `${s.notes}\n${notes}` : notes) : s.notes } : s
        )
      )
      setShowStatusModal(false)
      setStatusModalIds([])
    } catch (err) {
      console.error(err)
      alert("Failed to update status")
    }
  }, [statusModalIds])

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
        <AdminTabs />
      </div>

      <FilterBar
        campaigns={allCampaigns}
        selectedCampaignId={selectedCampaignId}
        onCampaignChange={(id) => {
          setSelectedCampaignId(id)
          if (id) {
            router.replace(pathname + "?" + new URLSearchParams({ campaign: String(id) }).toString(), { scroll: false })
          } else {
            router.replace(pathname, { scroll: false })
          }
        }}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
        onUpdateMetrics={handleUpdateMetrics}
        isViewer={isViewer}
        isScraping={isScraping}
      />

      {stats && (
        <BudgetBar
          budgetUsed={stats.budget_used}
          budgetTotal={stats.budget_total}
          estRevenue={stats.est_revenue}
        />
      )}

      {stats && (
        <StatCards
          totalSubmissions={stats.total_submissions}
          verifiedSubmissions={stats.submissions_with_stats}
          totalViews={stats.total_views}
          totalInteractions={stats.total_interactions}
          estRevenue={stats.est_revenue}
        />
      )}

      <SubmissionsSection
        submissions={submissions}
        campaignId={selectedCampaignId}
        selectedPlatform={platformFilter}
        onPlatformChange={setPlatformFilter}
        onRefreshMetrics={handleRefreshMetrics}
        onDeleteSelected={handleDeleteSelected}
        onUpdateStatus={handleUpdateStatus}
        isViewer={isViewer}
        usViewersPct={allCampaigns.find((c) => c.id === selectedCampaignId)?.us_viewers_pct}
        ukViewersPct={allCampaigns.find((c) => c.id === selectedCampaignId)?.uk_viewers_pct}
        includeUkViews={allCampaigns.find((c) => c.id === selectedCampaignId)?.include_uk_views || false}
        onUpdateUsViewersPct={async (id, pct) => {
          const token = getToken()
          if (!token) return
          try {
            await submissionsApi.update(token, id, { us_viewers_pct: pct })
            setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, us_viewers_pct: pct } : s))
          } catch (err) { console.error(err) }
        }}
        onUpdateUkViewersPct={async (id, pct) => {
          const token = getToken()
          if (!token) return
          try {
            await submissionsApi.update(token, id, { uk_viewers_pct: pct })
            setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, uk_viewers_pct: pct } : s))
          } catch (err) { console.error(err) }
        }}
      />

      {showStatusModal && !isViewer && (
        <UpdateStatusModal
          selectedCount={statusModalIds.length}
          onConfirm={handleConfirmStatusUpdate}
          onClose={() => { setShowStatusModal(false); setStatusModalIds([]) }}
        />
      )}

      <ConfirmModal
        open={!!deleteConfirm}
        title="Delete Submissions"
        message={`Are you sure you want to delete ${deleteConfirm?.ids.length || 0} submission(s)? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteSelected}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
