"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getToken } from "@/lib/auth"
import { creators as creatorsApi, payments as paymentsApi, type CreatorDetail } from "@/lib/api"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { formatNumber, formatCurrency, platformIcon } from "@/lib/utils"
import { ArrowLeft, ExternalLink, DollarSign, X } from "lucide-react"
import { useToast } from "@/components/ui/toast"

export default function CreatorDetailPage() {
  const { email } = useParams<{ email: string }>()
  const decodedEmail = decodeURIComponent(email)
  const [creator, setCreator] = useState<CreatorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [platformFilter, setPlatformFilter] = useState("")
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [payoutSubId, setPayoutSubId] = useState<number | null>(null)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutMethod, setPayoutMethod] = useState("paypal")
  const [payoutRef, setPayoutRef] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const token = getToken()
    if (!token) return
    creatorsApi.get(token, decodedEmail)
      .then(setCreator)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [decodedEmail])

  async function handlePayout() {
    if (!payoutSubId) return
    const token = getToken()
    if (!token) return
    try {
      await paymentsApi.create(token, {
        submission_id: payoutSubId,
        amount: parseFloat(payoutAmount) || 0,
        method: payoutMethod,
        reference: payoutRef,
      })
      toast({ description: "Payment logged", variant: "success" })
      setPayoutOpen(false)
      // Refresh
      creatorsApi.get(token, decodedEmail).then(setCreator).catch(console.error)
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "error" })
    }
  }

  if (loading || !creator) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>
  }

  const filteredSubs = platformFilter ? creator.submissions.filter((s) => s.platform === platformFilter) : creator.submissions
  const platforms = Array.from(new Set(creator.submissions.map((s) => s.platform)))

  return (
    <div>
      <Link href="/admin/creators" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to creators
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Submissions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-zinc-100">{creator.name || creator.email}</h1>
          </div>
          <p className="text-sm text-zinc-500 font-mono mb-6">{creator.email}</p>

          {/* Platform filter */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setPlatformFilter("")} className={`text-xs px-2.5 py-1 rounded ${!platformFilter ? "bg-green-400/20 text-green-400" : "text-zinc-500 hover:text-zinc-300"}`}>All</button>
            {platforms.map((p) => (
              <button key={p} onClick={() => setPlatformFilter(p)} className={`text-xs px-2.5 py-1 rounded ${platformFilter === p ? "bg-green-400/20 text-green-400" : "text-zinc-500 hover:text-zinc-300"}`}>{platformIcon(p)} {p}</button>
            ))}
          </div>

          {/* Submissions */}
          <div className="space-y-3">
            {filteredSubs.map((sub) => (
              <div key={sub.id} className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{platformIcon(sub.platform)}</span>
                      <Link href={`/admin/campaigns/${sub.campaign_id}/submissions/${sub.id}`} className="text-sm text-green-400 hover:underline">#{sub.id}</Link>
                      <span className="text-xs text-zinc-500">{sub.campaign_name}</span>
                    </div>
                    <a href={sub.post_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-zinc-400 hover:text-zinc-300 flex items-center gap-1 mt-1">
                      {sub.post_url.substring(0, 60)}... <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={sub.status} />
                    {sub.status !== "paid" && (
                      <button onClick={() => { setPayoutSubId(sub.id); setPayoutAmount(sub.est_earnings.toFixed(2)); setPayoutOpen(true) }} className="text-green-400 hover:text-green-300 transition-colors">
                        <DollarSign className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div><p className="text-[10px] text-zinc-600 uppercase">Views</p><p className="text-sm font-mono text-zinc-100">{formatNumber(sub.views)}</p></div>
                  <div><p className="text-[10px] text-zinc-600 uppercase">Likes</p><p className="text-sm font-mono text-zinc-100">{formatNumber(sub.likes)}</p></div>
                  <div><p className="text-[10px] text-zinc-600 uppercase">Comments</p><p className="text-sm font-mono text-zinc-100">{formatNumber(sub.comments)}</p></div>
                  <div><p className="text-[10px] text-zinc-600 uppercase">Earnings</p><p className="text-sm font-mono text-green-400">{formatCurrency(sub.est_earnings)}</p></div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment history */}
          {creator.payment_history.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100 mb-4">Payment History</h2>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-4 py-3">Date</th>
                      <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-4 py-3">Amount</th>
                      <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-4 py-3">Views Paid</th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-4 py-3">Paid By</th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-4 py-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creator.payment_history.map((p, i) => (
                      <tr key={i} className="border-b border-white/[0.03]">
                        <td className="px-4 py-3 text-sm text-zinc-400">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-green-400">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-zinc-100">{formatNumber(p.views_paid)}</td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{p.paid_by}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500 font-mono">{p.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Stats sidebar */}
        <div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">Creator Stats</h3>
            {[
              { label: "Total Submissions", value: formatNumber(creator.total_submissions) },
              { label: "Total Views", value: formatNumber(creator.total_views) },
              { label: "Total Comments", value: formatNumber(creator.total_comments) },
              { label: "Total Paid", value: formatCurrency(creator.total_paid), accent: true },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{s.label}</p>
                <p className={`text-lg font-bold ${s.accent ? "text-green-400" : "text-zinc-100"}`}>{s.value}</p>
              </div>
            ))}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Platforms</p>
              <div className="flex gap-1 mt-1">
                {creator.platforms.map((p) => (
                  <span key={p} className="bg-green-400/10 text-green-400 text-[10px] font-mono px-1.5 py-0.5 rounded">{p}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Campaigns</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {creator.campaigns.map((c) => (
                  <span key={c} className="bg-white/[0.05] text-zinc-300 text-[10px] px-1.5 py-0.5 rounded">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Modal */}
      {payoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-xl border border-white/[0.04] bg-[#0d2e1c] backdrop-blur-md w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-zinc-100">Log Payment</h3>
              <button onClick={() => setPayoutOpen(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Amount ($)</label>
                <input type="number" step="0.01" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Method</label>
                <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30">
                  <option value="paypal">PayPal</option><option value="bank">Bank Transfer</option><option value="crypto">Crypto</option><option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Reference</label>
                <input value={payoutRef} onChange={(e) => setPayoutRef(e.target.value)} placeholder="Transaction ID" className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPayoutOpen(false)} className="border border-white/[0.06] bg-transparent text-zinc-300 hover:bg-white/[0.05] text-xs font-medium px-4 py-2 rounded-lg">Cancel</button>
              <button onClick={handlePayout} className="bg-green-400 text-black font-extrabold text-xs px-6 py-2 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)]">Log Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
