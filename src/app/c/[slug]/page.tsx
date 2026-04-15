"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { publicApi, type PublicCampaign } from "@/lib/api"
import { formatNumber, formatCurrency, platformIcon } from "@/lib/utils"

export default function CampaignSubmitPage() {
  const params = useParams()
  const slug = params.slug as string

  const [campaign, setCampaign] = useState<PublicCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Form state
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [postUrl, setPostUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    publicApi.campaign(slug)
      .then(setCampaign)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    setSubmitting(true)

    try {
      const result = await publicApi.submit(slug, {
        clipper_email: email,
        clipper_name: name || undefined,
        post_url: postUrl,
      })
      // Redirect to success page
      const successUrl = `/c/${slug}/success?email=${encodeURIComponent(email)}&token=${encodeURIComponent(result.submission_token)}`
      window.location.href = successUrl
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">{error || "Campaign not found"}</p>
          <Link
            href="/"
            className="bg-lime-400 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(163,230,53,0.4)] hover:bg-lime-300 transition-all"
          >
            Back to Campaigns
          </Link>
        </div>
      </div>
    )
  }

  const budgetPct = campaign.budget_total > 0 ? Math.min(100, (campaign.budget_used / campaign.budget_total) * 100) : 0
  const platforms = campaign.accepted_platforms ? campaign.accepted_platforms.split(",").map((p) => p.trim()) : []

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-lime-500/30">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime-400/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              &larr; All Campaigns
            </Link>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Campaign Info - 2 cols */}
            <div className="md:col-span-2 space-y-4">
              {/* Campaign card */}
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden">
                {campaign.thumbnail_url && (
                  <img
                    src={campaign.thumbnail_url}
                    alt={campaign.name}
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-4 space-y-3">
                  <div>
                    <h1 className="font-bold text-lg text-zinc-100">{campaign.name}</h1>
                    <p className="text-xs text-zinc-500 mt-0.5">{campaign.client_name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">CPM Rate</span>
                      <p className="text-sm font-bold text-lime-400">{formatCurrency(campaign.cpm_rate)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Max Payout</span>
                      <p className="text-sm font-bold text-zinc-100">{formatCurrency(campaign.max_payout)}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Submissions</span>
                    <p className="text-sm font-semibold text-zinc-200">{formatNumber(campaign.total_submissions)}</p>
                  </div>

                  {/* Budget bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Budget Used</span>
                      <span className="text-[10px] text-zinc-500">{formatCurrency(campaign.budget_used)} / {formatCurrency(campaign.budget_total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-lime-400 transition-all duration-500"
                        style={{ width: `${budgetPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Platforms */}
                  {platforms.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Accepted Platforms</span>
                      <div className="flex flex-wrap gap-1.5">
                        {platforms.map((p) => (
                          <span
                            key={p}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/[0.05] text-zinc-300 border border-white/[0.06]"
                          >
                            {platformIcon(p.toLowerCase())} {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {campaign.brief_url && (
                <a
                  href={campaign.brief_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center border border-white/[0.06] bg-transparent text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] transition-all"
                >
                  View Brief &rarr;
                </a>
              )}
            </div>

            {/* Submission Form - 3 cols */}
            <div className="md:col-span-3">
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-6">
                <h2 className="font-bold text-sm text-zinc-100 mb-1">Submit Your Clip</h2>
                <p className="text-xs text-zinc-500 mb-6">Paste your post URL and we&apos;ll start tracking automatically.</p>

                {campaign.status !== "open" ? (
                  <div className="text-center py-8">
                    <p className="text-zinc-400 text-sm">This campaign is no longer accepting submissions.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30 placeholder:text-zinc-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                        Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name or handle"
                        className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30 placeholder:text-zinc-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                        Post URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={postUrl}
                        onChange={(e) => setPostUrl(e.target.value)}
                        placeholder="https://tiktok.com/@user/video/..."
                        className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30 placeholder:text-zinc-600 transition-colors"
                      />
                    </div>

                    {submitError && (
                      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-lime-400 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(163,230,53,0.4)] hover:bg-lime-300 transition-all disabled:opacity-40"
                    >
                      {submitting ? "Submitting..." : "Submit Clip"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
