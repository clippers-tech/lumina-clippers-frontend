"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { getToken } from "@/lib/auth"
import {
  payments as paymentsApi,
  campaigns as campaignsApi,
  type PaymentLog,
  type Campaign,
} from "@/lib/api"
import { AdminTabs } from "@/components/admin/AdminTabs"
import { AdminGuard } from "@/components/admin/AdminGuard"
import { Pagination } from "@/components/admin/Pagination"
import { LoadingState } from "@/components/admin/LoadingState"
import { EmptyState } from "@/components/admin/EmptyState"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2, DollarSign, ChevronDown, Check, Clock, CheckCircle } from "lucide-react"

type FilterMode = "paid" | "to_be_paid" | "rejected"

/* ── Campaign Dropdown ────────────────────────────────── */
function CampaignDropdown({
  campaigns,
  value,
  onChange,
}: {
  campaigns: Campaign[]
  value: number | null
  onChange: (id: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const selected = campaigns.find((c) => c.id === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 bg-white/[0.05] border border-white/[0.08] text-sm rounded-lg px-3 py-2 min-w-[180px] focus:outline-none focus:border-green-400/30 transition-colors hover:bg-white/[0.08]"
      >
        <span className={selected ? "text-zinc-100 truncate" : "text-zinc-500"}>
          {selected ? selected.name : "All Campaigns"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] max-h-72 overflow-y-auto rounded-lg border border-green-400/[0.12] bg-[#0a2015] shadow-2xl shadow-black/60 ring-1 ring-black/20">
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false) }}
            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
              !value ? "text-green-400 bg-green-400/[0.08]" : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
            }`}
          >
            All Campaigns
          </button>
          {campaigns.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onChange(c.id); setOpen(false) }}
              className={`w-full flex items-center justify-between text-left px-3 py-2.5 text-sm transition-colors ${
                c.id === value
                  ? "text-green-400 bg-green-400/[0.08]"
                  : "text-zinc-200 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span className="truncate">{c.name}</span>
              {c.id === value && <Check className="w-3.5 h-3.5 text-green-400 shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────── */
export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentLog[]>([])
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterMode, setFilterMode] = useState<FilterMode>("paid")
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [prefillSubmissionId, setPrefillSubmissionId] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [prefillAmount, setPrefillAmount] = useState("")
  const [addForm, setAddForm] = useState({
    submission_id: "",
    amount: "",
    method: "",
    reference: "",
    notes: "",
  })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState("")

  // Load campaigns for dropdown
  useEffect(() => {
    const token = getToken()
    if (!token) return
    campaignsApi.list(token).then(setAllCampaigns).catch(console.error)
  }, [])

  const fetchPayments = useCallback(async () => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    try {
      const res = await paymentsApi.list(
        token,
        filterMode,
        undefined,
        page,
        25,
        selectedCampaignId ?? undefined
      )
      setPayments(res.items)
      setTotalPages(res.pages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterMode, page, selectedCampaignId])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Delete this payment record?")) return
    const token = getToken()
    if (!token) return
    try {
      await paymentsApi.delete(token, id)
      setPayments((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error(err)
    }
  }, [])

  const openPayModal = (submissionId?: number, amount?: number) => {
    setAddForm({
      submission_id: submissionId?.toString() || "",
      amount: amount?.toFixed(2) || "",
      method: "",
      reference: "",
      notes: "",
    })
    setPrefillSubmissionId(submissionId?.toString() || "")
    setPrefillAmount(amount?.toFixed(2) || "")
    setShowAddModal(true)
  }

  const handleAdd = useCallback(async () => {
    const token = getToken()
    if (!token) return
    setAddLoading(true)
    setAddError("")
    try {
      const newPayment = await paymentsApi.create(token, {
        submission_id: Number(addForm.submission_id),
        amount: Number(addForm.amount),
        method: addForm.method || undefined,
        reference: addForm.reference || undefined,
        notes: addForm.notes || undefined,
      })
      setPayments((prev) => [newPayment, ...prev])
      setShowAddModal(false)
      setAddForm({ submission_id: "", amount: "", method: "", reference: "", notes: "" })
      // Refresh to update counts
      fetchPayments()
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Failed to create payment")
    } finally {
      setAddLoading(false)
    }
  }, [addForm, fetchPayments])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const isClaimView = filterMode === "to_be_paid" || filterMode === "rejected"

  const filterTabs: { mode: FilterMode; label: string }[] = [
    { mode: "paid", label: "Paid" },
    { mode: "to_be_paid", label: "To be paid" },
    { mode: "rejected", label: "Rejected" },
  ]

  return (
    <AdminGuard>
      <div>
        {/* Header */}
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">
            Admin Panel
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Payments</h1>
        </div>

        <div className="mt-6 mb-6">
          <AdminTabs />
        </div>

        {/* Filters bar — matches screenshot */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Status pill tabs */}
            <div className="flex items-center gap-2">
              {filterTabs.map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => { setFilterMode(mode); setPage(1) }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                    filterMode === mode
                      ? "bg-green-400 text-black shadow-[0_0_12px_-3px_rgba(74,222,128,0.4)]"
                      : "bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200 border border-white/[0.06]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Campaign dropdown */}
            <CampaignDropdown
              campaigns={allCampaigns}
              value={selectedCampaignId}
              onChange={(id) => { setSelectedCampaignId(id); setPage(1) }}
            />

            {/* ALL PAID SUBMISSIONS — right side */}
            <button
              onClick={() => { setFilterMode("paid"); setSelectedCampaignId(null); setPage(1) }}
              className="sm:ml-auto text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-green-400 transition-colors whitespace-nowrap"
            >
              All Paid Submissions
            </button>
          </div>
        </div>

        {/* Add Payment button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => openPayModal()}
            className="flex items-center gap-1.5 bg-green-400 text-black text-xs font-extrabold px-5 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        </div>

        {/* Payments table */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden">
          {loading ? (
            <LoadingState />
          ) : payments.length === 0 ? (
            <EmptyState message={
              filterMode === "paid"
                ? "No paid submissions yet"
                : filterMode === "to_be_paid"
                  ? "No submissions awaiting payment"
                  : "No rejected submissions"
            } />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      Creator
                    </th>
                    <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      Campaign
                    </th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      {isClaimView ? "Est. Earnings" : "Amount"}
                    </th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      Views
                    </th>
                    {filterMode === "paid" && (
                      <>
                        <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                          Method
                        </th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                          Reference
                        </th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                          Paid By
                        </th>
                      </>
                    )}
                    {isClaimView && (
                      <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                        Status
                      </th>
                    )}
                    <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      Date
                    </th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr
                      key={`${p.id}-${p.submission_id}`}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-zinc-100">
                          {p.creator_email}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          Sub #{p.submission_id}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-zinc-300">{p.campaign_name}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-mono text-green-400 font-semibold">
                          {formatCurrency(p.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-mono text-zinc-100">
                          {p.paid_views?.toLocaleString() ?? "-"}
                        </span>
                      </td>
                      {filterMode === "paid" && (
                        <>
                          <td className="px-5 py-4">
                            <span className="text-sm text-zinc-400">{p.method || "-"}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-zinc-400 font-mono">
                              {p.reference || "-"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-zinc-500">
                              {p.paid_by_email || "-"}
                            </span>
                          </td>
                        </>
                      )}
                      {isClaimView && (
                        <td className="px-5 py-4">
                          {(p as PaymentLog & { status?: string }).status === "payment_claimed" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md">
                              <Clock className="w-3 h-3" />
                              Claimed
                            </span>
                          ) : (p as PaymentLog & { status?: string }).status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-md">
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </td>
                      )}
                      <td className="px-5 py-4">
                        <span className="text-sm text-zinc-500">
                          {formatDate(p.paid_at)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isClaimView && (
                            <button
                              onClick={() => openPayModal(p.submission_id, p.amount)}
                              className="flex items-center gap-1 bg-green-400/10 text-green-400 text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-green-400/20 transition-all"
                            >
                              <DollarSign className="w-3 h-3" />
                              Pay
                            </button>
                          )}
                          {filterMode === "paid" && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* Add/Process Payment Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0d2e1c]/95 border border-white/[0.06] backdrop-blur-md rounded-xl w-full max-w-md mx-4 p-6">
              <h2 className="text-lg font-bold text-zinc-100 mb-1">
                {prefillSubmissionId ? "Process Payment" : "Add Payment"}
              </h2>
              {prefillSubmissionId && (
                <p className="text-xs text-zinc-500 mb-4">
                  Recording payment for Submission #{prefillSubmissionId}
                </p>
              )}

              {addError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-4">
                  {addError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Submission ID
                  </label>
                  <input
                    type="number"
                    value={addForm.submission_id}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, submission_id: e.target.value }))
                    }
                    disabled={!!prefillSubmissionId}
                    className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors disabled:opacity-50"
                    placeholder="e.g. 42"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.amount}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                    placeholder="e.g. 150.00"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Method
                  </label>
                  <select
                    value={addForm.method}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, method: e.target.value }))
                    }
                    className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  >
                    <option value="" className="bg-[#0d2e1c] text-zinc-100">Select method...</option>
                    <option value="PayPal" className="bg-[#0d2e1c] text-zinc-100">PayPal</option>
                    <option value="Wire Transfer" className="bg-[#0d2e1c] text-zinc-100">Wire Transfer</option>
                    <option value="Crypto" className="bg-[#0d2e1c] text-zinc-100">Crypto</option>
                    <option value="Wise" className="bg-[#0d2e1c] text-zinc-100">Wise</option>
                    <option value="Other" className="bg-[#0d2e1c] text-zinc-100">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Reference / Transaction ID
                  </label>
                  <input
                    value={addForm.reference}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, reference: e.target.value }))
                    }
                    className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                    placeholder="e.g. TXN-12345"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={addForm.notes}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors resize-none"
                    rows={3}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setAddError("")
                    setPrefillSubmissionId("")
                    setPrefillAmount("")
                    setAddForm({
                      submission_id: "",
                      amount: "",
                      method: "",
                      reference: "",
                      notes: "",
                    })
                  }}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={
                    addLoading || !addForm.submission_id || !addForm.amount
                  }
                  className="bg-green-400 text-black text-xs font-extrabold px-5 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading ? "Processing..." : prefillSubmissionId ? "Confirm Payment" : "Add Payment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  )
}
