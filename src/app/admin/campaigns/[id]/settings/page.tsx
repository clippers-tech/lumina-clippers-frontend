"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getToken } from "@/lib/auth"
import { campaigns as campaignsApi, type Campaign } from "@/lib/api"
import { useToast } from "@/components/ui/toast"

export default function CampaignSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const campaignId = parseInt(id)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { toast } = useToast()

  const [form, setForm] = useState({
    name: "", slug: "", client_name: "", client_email: "",
    cpm_rate: "", max_payout: "", budget_total: "",
    brief_url: "", thumbnail_url: "", accepted_platforms: "", us_viewers_pct: "",
    include_uk_views: false, uk_viewers_pct: "",
    target_views: "", requirements_url: "", description: "",
    min_publish_date: "", min_views_payout: "", status: "",
  })

  useEffect(() => {
    const token = getToken()
    if (!token) return
    campaignsApi.get(token, campaignId)
      .then((c) => {
        setForm({
          name: c.name, slug: c.slug, client_name: c.client_name,
          client_email: c.client_email, cpm_rate: c.cpm_rate.toString(),
          max_payout: c.max_payout.toString(), budget_total: c.budget_total.toString(),
          brief_url: c.brief_url, thumbnail_url: c.thumbnail_url,
          accepted_platforms: c.accepted_platforms,
          us_viewers_pct: c.us_viewers_pct?.toString() || "90",
          include_uk_views: c.include_uk_views || false,
          uk_viewers_pct: c.uk_viewers_pct?.toString() || "",
          target_views: c.target_views?.toString() || "",
          requirements_url: c.requirements_url || "",
          description: c.description || "",
          min_publish_date: c.min_publish_date ? c.min_publish_date.slice(0, 16) : "",
          min_views_payout: c.min_views_payout?.toString() || "",
          status: c.status,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [campaignId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setSuccess("")
    setSaving(true)
    try {
      const token = getToken()!
      const data: Record<string, unknown> = {
        name: form.name, slug: form.slug, client_name: form.client_name,
        client_email: form.client_email, brief_url: form.brief_url,
        thumbnail_url: form.thumbnail_url, accepted_platforms: form.accepted_platforms,
        requirements_url: form.requirements_url, description: form.description,
        status: form.status, cpm_rate: parseFloat(form.cpm_rate) || 0,
        max_payout: parseFloat(form.max_payout) || 0,
        budget_total: parseFloat(form.budget_total) || 0,
        us_viewers_pct: parseFloat(form.us_viewers_pct) || 90,
        include_uk_views: form.include_uk_views,
        uk_viewers_pct: form.include_uk_views ? (parseFloat(form.uk_viewers_pct) || 45) : null,
        target_views: form.target_views ? parseInt(form.target_views) : null,
        min_views_payout: form.min_views_payout ? parseInt(form.min_views_payout) : null,
        min_publish_date: form.min_publish_date || null,
      }
      await campaignsApi.update(token, campaignId, data as Partial<Campaign>)
      setSuccess("Campaign updated")
      toast({ description: "Campaign settings saved", variant: "success" })
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save"
      setError(msg)
      toast({ title: "Save Failed", description: msg, variant: "error" })
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!confirm("Archive this campaign? It will be hidden from the main list.")) return
    const token = getToken()!
    await campaignsApi.delete(token, campaignId)
    router.push("/admin/campaigns")
  }

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>
  }

  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block"
  const inputClass = "w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 placeholder:text-zinc-600"
  const helpClass = "text-[10px] text-zinc-600 mt-1"

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Campaign Settings</h1>

      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-6 mb-6">
        <form onSubmit={handleSave} className="space-y-5">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-400">{success}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Campaign Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass} /></div>
            <div><label className={labelClass}>Slug</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className={inputClass} /><p className={helpClass}>Lowercase, numbers, hyphens</p></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Client Name</label><input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required className={inputClass} /></div>
            <div><label className={labelClass}>Client Email</label><input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>CPM Rate ($)</label><input type="number" step="0.01" value={form.cpm_rate} onChange={(e) => setForm({ ...form, cpm_rate: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Max Payout ($)</label><input type="number" step="0.01" value={form.max_payout} onChange={(e) => setForm({ ...form, max_payout: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Max Budget ($)</label><input type="number" step="0.01" value={form.budget_total} onChange={(e) => setForm({ ...form, budget_total: e.target.value })} className={inputClass} /><p className={helpClass}>Leave empty for unlimited</p></div>
          </div>

          <div><label className={labelClass}>Target Views</label><input type="number" value={form.target_views} onChange={(e) => setForm({ ...form, target_views: e.target.value })} placeholder="No view cap" className={inputClass} /></div>

          {/* Geo Settings */}
          <div className="border border-white/[0.06] rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300">Geo View Settings</h3>
            <div className={form.include_uk_views ? "grid grid-cols-2 gap-4" : ""}>
              <div><label className={labelClass}>US Viewers %</label><input type="number" step="1" min="0" max="100" value={form.us_viewers_pct} onChange={(e) => setForm({ ...form, us_viewers_pct: e.target.value })} className={inputClass} /></div>
              {form.include_uk_views && <div><label className={labelClass}>UK Viewers %</label><input type="number" step="1" min="0" max="100" value={form.uk_viewers_pct} onChange={(e) => setForm({ ...form, uk_viewers_pct: e.target.value })} className={inputClass} /></div>}
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400">Include UK Views</label>
              <button type="button" onClick={() => {
                const newVal = !form.include_uk_views
                if (newVal) {
                  const currentUs = parseFloat(form.us_viewers_pct) || 90
                  const half = Math.round(currentUs / 2)
                  setForm(prev => ({ ...prev, include_uk_views: true, us_viewers_pct: String(half), uk_viewers_pct: String(currentUs - half) }))
                } else {
                  const combinedPct = (parseFloat(form.us_viewers_pct) || 0) + (parseFloat(form.uk_viewers_pct) || 0)
                  setForm(prev => ({ ...prev, include_uk_views: false, us_viewers_pct: String(Math.round(combinedPct)), uk_viewers_pct: "" }))
                }
              }} className={`relative w-11 h-6 rounded-full transition-colors ${form.include_uk_views ? "bg-green-400" : "bg-white/10"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.include_uk_views ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          <div><label className={labelClass}>Thumbnail URL</label><input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Brief URL</label><input value={form.brief_url} onChange={(e) => setForm({ ...form, brief_url: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Requirements URL</label><input value={form.requirements_url} onChange={(e) => setForm({ ...form, requirements_url: e.target.value })} className={inputClass} /></div>

          <div className="border border-white/[0.06] rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300">Validation Requirements</h3>
            <div><label className={labelClass}>Min Publish Date</label><input type="datetime-local" value={form.min_publish_date} onChange={(e) => setForm({ ...form, min_publish_date: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Min Views for Payout</label><input type="number" value={form.min_views_payout} onChange={(e) => setForm({ ...form, min_views_payout: e.target.value })} placeholder="e.g. 1000" className={inputClass} /></div>
          </div>

          <div><label className={labelClass}>Accepted Platforms</label><input value={form.accepted_platforms} onChange={(e) => setForm({ ...form, accepted_platforms: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputClass} resize-none`} /></div>
          <div><label className={labelClass}>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
            <option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option><option value="archived">Archived</option>
          </select></div>

          <button type="submit" disabled={saving} className="w-full h-10 bg-green-400 text-black font-extrabold text-xs px-6 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h3 className="text-sm font-bold text-red-400 mb-3">Danger Zone</h3>
        <button onClick={handleArchive} className="bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-500/30 transition-all">
          Archive Campaign
        </button>
      </div>
    </div>
  )
}
