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
import { BudgetBar } from "@/components/admin/BudgetBar"
import { StatCards } from "@/components/admin/StatCards"
import { SubmissionsSection } from "@/components/admin/SubmissionsSection"
import { UpdateStatusModal } from "@/components/admin/UpdateStatusModal"
import { SendUploadLinksModal } from "@/components/admin/SendUploadLinksModal"
import { BulkAddModal } from "@/components/admin/BulkAddModal"
import { useUser } from "@/lib/user-context"

export default function DashboardPage() {
  const { isViewer } = useUser()
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState("")
  const [platformFilter, setPlatformFilter] = useState("")
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusModalIds, setStatusModalIds] = useState<number[]>([])
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showUploadLinksModal, setShowUploadLinksModal] = useState(false)
  const [showBulkAddModal, setShowBulkAddModal] = useState(false)
  const [sendingLinks, setSendingLinks] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    campaignsApi
      .list(token)
      .then((data) => {
        setAllCampaigns(data)
        if (data.length > 0) setSelectedCampaignId(data[0].id)
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

    campaignsApi.stats(token, selectedCampaignId).then(setStats).catch(console.error)

    const params: { status?: string; platform?: string } = {}
    if (statusFilter) params.status = statusFilter
    if (platformFilter) params.platform = platformFilter

    submissionsApi
      .list(token, selectedCampaignId, { ...params, per_page: 200 })
      .then((res) => setSubmissions(res.items))
      .catch(console.error)
  }, [selectedCampaignId, statusFilter, platformFilter])

  const handleSendUploadLinks = useCallback(() => {
    setShowUploadLinksModal(true)
  }, [])

  const handleConfirmSendLinks = useCallback(async (submissionIds: number[]) => {
    const token = getToken()
    if (!token) return
    setSendingLinks(true)
    try {
      const result = await submissionsApi.sendUploadLinks(token, submissionIds)
      alert(result.detail)
      setShowUploadLinksModal(false)
    } catch (err) {
      console.error(err)
      alert("Failed to send upload links")
    } finally {
      setSendingLinks(false)
    }
  }, [])

  const handleUpdateMetrics = useCallback(() => {
    if (!selectedCampaignId) return
    const token = getToken()
    if (!token) return
    submissions.forEach((sub) => {
      submissionsApi.scrape(token, sub.id).catch(console.error)
    })
    alert("Metrics update triggered for all visible submissions")
  }, [selectedCampaignId, submissions])

  const handleDownloadCsv = useCallback(() => {
    if (!selectedCampaignId) return
    window.open(campaignsApi.exportUrl(selectedCampaignId), "_blank")
  }, [selectedCampaignId])

  const handleRefreshMetrics = useCallback((ids: number[]) => {
    const token = getToken()
    if (!token) return
    ids.forEach((id) => {
      submissionsApi.scrape(token, id).catch(console.error)
    })
    alert(`Refresh triggered for ${ids.length} submission(s)`)
  }, [])

  const handleDeleteSelected = useCallback((ids: number[]) => {
    if (ids.length === 0) return
    if (!confirm(`Delete ${ids.length} submission(s)?`)) return
    const token = getToken()
    if (!token) return
    Promise.all(ids.map((id) => submissionsApi.delete(token, id)))
      .then(() => {
        setSubmissions((prev) => prev.filter((s) => !ids.includes(s.id)))
      })
      .catch(console.error)
  }, [])

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
        <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <DashboardHeader />

      <FilterBar
        campaigns={allCampaigns}
        selectedCampaignId={selectedCampaignId}
        onCampaignChange={setSelectedCampaignId}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
        onSendUploadLinks={handleSendUploadLinks}
        onUpdateMetrics={handleUpdateMetrics}
        onDownloadCsv={handleDownloadCsv}
        onBulkAdd={() => setShowBulkAddModal(true)}
        isViewer={isViewer}
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

      {showUploadLinksModal && !isViewer && (
        <SendUploadLinksModal
          submissions={submissions}
          onSend={handleConfirmSendLinks}
          onClose={() => setShowUploadLinksModal(false)}
          sending={sendingLinks}
        />
      )}

      {showBulkAddModal && !isViewer && (
        <BulkAddModal
          campaigns={allCampaigns}
          selectedCampaignId={selectedCampaignId}
          onSubmit={async (campaignId, items) => {
            const token = getToken()
            if (!token) throw new Error("Not authenticated")
            const res = await submissionsApi.bulkAdd(token, campaignId, items)
            if (campaignId === selectedCampaignId) {
              submissionsApi.list(token, campaignId, { per_page: 200 }).then((r) => setSubmissions(r.items)).catch(console.error)
              campaignsApi.stats(token, campaignId).then(setStats).catch(console.error)
            }
            return res
          }}
          onClose={() => setShowBulkAddModal(false)}
        />
      )}
    </div>
  )
}
