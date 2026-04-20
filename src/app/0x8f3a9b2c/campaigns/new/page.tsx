"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getToken } from "@/lib/auth"
import { campaigns, type Campaign } from "@/lib/api"

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "", slug: "", client_name: "", client_email: "",
    cpm_rate: "", client_cpm_rate: "", max_payout: "", budget_total: "", client_budget_total: "",
    brief_url: "", thumbnail_url: "",
    accepted_platforms: "instagram,tiktok,youtube,twitter",
    us_viewers_pct: "90", include_uk_views: false, uk_viewers_pct: "45",
    target_views: "", requirements_url: "", description: "",
    min_publish_date: "", min_views_payout: "", status: "draft",
  })

  function updateField(field: string, value: string) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === "name" && !prev.slug) updated.slug = slugify(value)
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const token = getToken()!
      const data: Record<string, unknown> = {
        name: form.name, slug: form.slug, client_name: form.client_name,
        client_email: form.client_email, brief_url: form.brief_url,
        thumbnail_url: form.thumbnail_url, accepted_platforms: form.accepted_platforms,
        requirements_url: form.requirements_url, description: form.description,
        status: form.status, cpm_rate: parseFloat(form.cpm_rate) || 0,
        client_cpm_rate: parseFloat(form.client_cpm_rate) || 0,
        max_payout: parseFloat(form.max_payout) || 0,
        budget_total: parseFloat(form.budget_total) || 0,
        client_budget_total: parseFloat(form.client_budget_total) || 0,
        us_viewers_pct: parseFloat(form.us_viewers_pct) || 90,
        include_uk_views: form.include_uk_views,
        uk_viewers_pct: form.include_uk_views ? (parseFloat(form.uk_viewers_pct) || 45) : null,
        target_views: form.target_views ? parseInt(form.target_views) : null,
        min_views_payout: form.min_views_payout ? parseInt(form.min_views_payout) : null,
        min_publish_date: form.min_publish_date || null,
      }
      const created = await campaigns.create(token, data as Partial<Campaign>)
      router.push(`/0x8f3a9b2c/campaigns/${created.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create")
    } finally {
      setLoading(false)
    }
  }

  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block"
  const inputClass = "w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 placeholder:text-zinc-600"
  const helpClass = "text-[10px] text-zinc-600 mt-1"

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">New Campaign</h1>
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Campaign Name</label>
              <input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="GTM Now" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Slug (URL-friendly)</label>
              <input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} placeholder="gtmnow" required className={inputClass} />
              <p className={helpClass}>Lowercase letters, numbers, and hyphens only</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Client Name</label>
              <input value={form.client_name} onChange={(e) => updateField("client_name", e.target.value)} placeholder="GTM Now" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Client Email</label>
              <input type="email" value={form.client_email} onChange={(e) => updateField("client_email", e.target.value)} placeholder="client@example.com" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Clipper CPM ($)</label>
              <input type="number" step="0.01" value={form.cpm_rate} onChange={(e) => updateField("cpm_rate", e.target.value)} placeholder="5.00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Client CPM ($)</label>
              <input type="number" step="0.01" value={form.client_cpm_rate} onChange={(e) => updateField("client_cpm_rate", e.target.value)} placeholder="7.00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Max Payout ($)</label>
              <input type="number" step="0.01" value={form.max_payout} onChange={(e) => updateField("max_payout", e.target.value)} placeholder="100" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Max Budget ($)</label>
              <input type="number" step="0.01" value={form.budget_total} onChange={(e) => updateField("budget_total", e.target.value)} placeholder="Unlimited" className={inputClass} />
              <p className={helpClass}>Leave empty for unlimited</p>
            </div>
            <div>
              <label className={labelClass}>Client Budget ($)</label>
              <input type="number" step="0.01" value={form.client_budget_total} onChange={(e) => updateField("client_budget_total", e.target.value)} placeholder="Same as max budget" className={inputClass} />
              <p className={helpClass}>Budget shown to client (leave 0 to use real budget)</p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Target Views (optional)</label>
            <input type="number" value={form.target_views} onChange={(e) => updateField("target_views", e.target.value)} placeholder="No view cap" className={inputClass} />
            <p className={helpClass}>Campaign auto-closes when paid submissions reach this view count</p>
          </div>

          {/* Geo Settings */}
          <div className="border border-white/[0.06] rounded-lg p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-1">Geo View Settings</h3>
              <p className={helpClass}>Values have ±20% natural variation per submission</p>
            </div>
            <div className={form.include_uk_views ? "grid grid-cols-2 gap-4" : ""}>
              <div>
                <label className={labelClass}>US Viewers %</label>
                <input type="number" step="1" min="0" max="100" value={form.us_viewers_pct} onChange={(e) => updateField("us_viewers_pct", e.target.value)} className={inputClass} />
              </div>
              {form.include_uk_views && (
                <div>
                  <label className={labelClass}>UK Viewers %</label>
                  <input type="number" step="1" min="0" max="100" value={form.uk_viewers_pct} onChange={(e) => updateField("uk_viewers_pct", e.target.value)} className={inputClass} />
                </div>
              )}
            </div>
            {form.include_uk_views && <p className={helpClass}>Combined: {(parseFloat(form.us_viewers_pct) || 0) + (parseFloat(form.uk_viewers_pct) || 0)}% primary market</p>}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-medium text-zinc-400">Include UK Views</label>
                <p className={helpClass}>Add UK as a primary market alongside US</p>
              </div>
              <button type="button" onClick={() => {
                const newVal = !form.include_uk_views
                setForm(prev => {
                  if (newVal) {
                    const currentUs = parseFloat(prev.us_viewers_pct) || 90
                    const half = Math.round(currentUs / 2)
                    return { ...prev, include_uk_views: true, us_viewers_pct: String(half), uk_viewers_pct: String(currentUs - half) }
                  }
                  const combinedPct = (parseFloat(prev.us_viewers_pct) || 0) + (parseFloat(prev.uk_viewers_pct) || 0)
                  return { ...prev, include_uk_views: false, us_viewers_pct: String(Math.round(combinedPct)), uk_viewers_pct: "0" }
                })
              }} className={`relative w-11 h-6 rounded-full transition-colors ${form.include_uk_views ? "bg-green-400" : "bg-white/10"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.include_uk_views ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Thumbnail URL</label>
            <input value={form.thumbnail_url} onChange={(e) => updateField("thumbnail_url", e.target.value)} placeholder="https://example.com/image.jpg" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Brief URL</label>
            <input value={form.brief_url} onChange={(e) => updateField("brief_url", e.target.value)} placeholder="https://drive.google.com/..." className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Requirements URL</label>
            <input value={form.requirements_url} onChange={(e) => updateField("requirements_url", e.target.value)} placeholder="https://example.com/requirements" className={inputClass} />
          </div>

          {/* Validation */}
          <div className="border border-white/[0.06] rounded-lg p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-1">Validation Requirements</h3>
              <p className={helpClass}>Submissions auto-rejected if they don&apos;t meet these criteria</p>
            </div>
            <div>
              <label className={labelClass}>Minimum Publish Date</label>
              <input type="datetime-local" value={form.min_publish_date} onChange={(e) => updateField("min_publish_date", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Minimum Views for Payout</label>
              <input type="number" value={form.min_views_payout} onChange={(e) => updateField("min_views_payout", e.target.value)} placeholder="e.g. 1000" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Accepted Platforms</label>
            <input value={form.accepted_platforms} onChange={(e) => updateField("accepted_platforms", e.target.value)} className={inputClass} />
            <p className={helpClass}>Comma-separated: instagram, tiktok, youtube, twitter</p>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Brief description..." rows={3} className={`${inputClass} resize-none`} />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={(e) => updateField("status", e.target.value)} className={inputClass}>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="flex-1 border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-4 py-2.5 rounded-lg transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 h-10 bg-green-400 text-black font-extrabold text-xs px-6 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50">
              {loading ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
