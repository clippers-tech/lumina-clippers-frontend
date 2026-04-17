"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getToken } from "@/lib/auth"
import { campaigns as campaignsApi, submissions as subsApi, type Campaign, type CampaignStats, type Submission } from "@/lib/api"
import { SubmissionGrid } from "@/components/admin/SubmissionGrid"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { formatNumber, formatCurrency } from "@/lib/utils"
import { Settings, Download, Copy, ExternalLink, Upload, X } from "lucide-react"
import { useToast } from "@/components/ui/toast"

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const campaignId = parseInt(id)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [subs, setSubs] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [platformFilter, setPlatformFilter] = useState("")
  const [copied, setCopied] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: Array<{ row: number; reason: string }> } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  function reload() {
    const token = getToken()
    if (!token) return
    Promise.all([
      campaignsApi.get(token, campaignId),
      campaignsApi.stats(token, campaignId),
      subsApi.list(token, campaignId, { status: statusFilter || undefined, platform: platformFilter || undefined, per_page: 200 }),
    ])
      .then(([c, s, sub]) => { setCampaign(c); setStats(s); setSubs(sub.items) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [campaignId, statusFilter, platformFilter])

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(""), 2000)
  }

  async function handleImport() {
    if (!importFile) return
    setImporting(true)
    setImportResult(null)
    try {
      const token = getToken()!
      const result = await campaignsApi.importCsv(token, campaignId, importFile)
      setImportResult(result)
      reload()
      if (result.imported > 0) toast({ description: `Imported ${result.imported} submission(s)`, variant: "success" })
      if (result.errors.length > 0) toast({ title: "Import Warnings", description: `${result.errors.length} row(s) had errors`, variant: "warning" })
    } catch (err: unknown) {
      setImportResult({ imported: 0, skipped: 0, errors: [{ row: 0, reason: err instanceof Error ? err.message : "Import failed" }] })
      toast({ title: "Import Failed", description: err instanceof Error ? err.message : "Import failed", variant: "error" })
    } finally {
      setImporting(false)
    }
  }

  function downloadTemplate() {
    const csv = "clipper_email,post_url,clipper_name\nexample@email.com,https://www.tiktok.com/@user/video/123456,John Doe\n"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "import_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !campaign || !stats) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const submissionUrl = `${baseUrl}/c/${campaign.slug}`

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-zinc-100">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-zinc-500">{campaign.client_name}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { setImportOpen(true); setImportResult(null); setImportFile(null) }} className="flex items-center gap-1.5 border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-4 py-2 rounded-lg transition-all">
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
          <a href={campaignsApi.exportUrl(campaignId)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-4 py-2 rounded-lg transition-all">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
          <Link href={`/0x8f3a9b2c/campaigns/${campaignId}/settings`} className="flex items-center gap-1.5 border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-4 py-2 rounded-lg transition-all">
            <Settings className="w-3.5 h-3.5" /> Settings
          </Link>
        </div>
      </div>

      {/* CSV Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-xl border border-white/[0.04] bg-[#0d2e1c] backdrop-blur-md w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-100">Import CSV</h2>
              <button onClick={() => setImportOpen(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-zinc-400 mb-4">Upload a CSV with columns: <code className="text-green-400">clipper_email</code>, <code className="text-green-400">post_url</code>, <code className="text-green-400">clipper_name</code> (optional)</p>
            <button onClick={downloadTemplate} className="text-xs text-green-400 hover:underline mb-4 block">Download Template</button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
            <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-white/[0.12] rounded-lg p-6 text-center cursor-pointer hover:border-green-400/30 transition-colors mb-4">
              {importFile ? <p className="text-sm text-zinc-100">{importFile.name}</p> : <p className="text-sm text-zinc-500">Click to select CSV file</p>}
            </div>
            {importResult && (
              <div className="mb-4 p-3 rounded-lg bg-white/[0.03] text-sm">
                <p className="text-zinc-100">Imported: <span className="text-green-400">{importResult.imported}</span> | Skipped: <span className="text-zinc-500">{importResult.skipped}</span></p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {importResult.errors.map((e, i) => <p key={i} className="text-xs text-red-400">Row {e.row}: {e.reason}</p>)}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleImport} disabled={!importFile || importing} className="flex-1 h-10 bg-green-400 text-black font-extrabold text-xs px-6 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50">
                {importing ? "Importing..." : "Import"}
              </button>
              <button onClick={() => setImportOpen(false)} className="border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-4 py-2 rounded-lg transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2 text-sm">
          <span className="text-zinc-500">Submission link:</span>
          <code className="text-green-400 text-xs font-mono">{submissionUrl}</code>
          <button onClick={() => copyToClipboard(submissionUrl, "submission")} className="text-zinc-500 hover:text-zinc-300">
            <Copy className="w-3.5 h-3.5" />
          </button>
          {copied === "submission" && <span className="text-[10px] text-green-400">Copied</span>}
        </div>
        {campaign.brief_url && (
          <a href={campaign.brief_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Brief
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Submissions", value: formatNumber(stats.total_submissions) },
          { label: "Verified", value: formatNumber(stats.submissions_with_stats) },
          { label: "Views", value: formatNumber(stats.total_views) },
          { label: "Interactions", value: formatNumber(stats.total_interactions) },
          { label: "Est. Revenue", value: formatCurrency(stats.est_revenue), accent: true },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.accent ? "text-green-400" : "text-zinc-100"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex gap-2 items-center">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Status:</span>
          {["", "awaiting_stats", "stats_verified", "paid", "rejected"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs px-2.5 py-1 rounded transition-colors ${statusFilter === s ? "bg-green-400/20 text-green-400" : "text-zinc-500 hover:text-zinc-300"}`}>
              {s ? s.replace(/_/g, " ") : "All"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Platform:</span>
          {["", "tiktok", "instagram", "youtube", "twitter"].map((p) => (
            <button key={p} onClick={() => setPlatformFilter(p)} className={`text-xs px-2.5 py-1 rounded transition-colors ${platformFilter === p ? "bg-green-400/20 text-green-400" : "text-zinc-500 hover:text-zinc-300"}`}>
              {p || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden">
        <SubmissionGrid
          submissions={subs}
          campaignId={campaignId}
          selectedIds={selectedIds}
          onToggleSelect={(id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
          onSelectAll={setSelectedIds}
        />
      </div>
    </div>
  )
}
