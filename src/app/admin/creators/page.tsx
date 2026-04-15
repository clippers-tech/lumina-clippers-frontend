"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken } from "@/lib/auth"
import { creators as creatorsApi, type Creator, type PaginatedResponse } from "@/lib/api"
import { AdminTabs } from "@/components/admin/AdminTabs"
import { AdminGuard } from "@/components/admin/AdminGuard"
import { Pagination } from "@/components/admin/Pagination"
import { formatNumber, formatCurrency } from "@/lib/utils"
import { Search } from "lucide-react"

export default function CreatorsPage() {
  const router = useRouter()
  const [data, setData] = useState<PaginatedResponse<Creator> | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    creatorsApi.list(token, search || undefined, page, 25)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search, page])

  return (
    <AdminGuard>
      <div>
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">Admin Panel</p>
          <h1 className="text-2xl font-bold text-zinc-100">Creators</h1>
          <p className="text-sm text-zinc-500 mt-1">All clippers and content creators</p>
        </div>
        <div className="mt-6 mb-6"><AdminTabs /></div>

        {/* Search */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search creators..."
              className="w-full pl-9 bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30"
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : !data || data.items.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">No creators found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">Creator</th>
                    <th className="text-center text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">Submissions</th>
                    <th className="text-center text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">Platforms</th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">Views</th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">Comments</th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">Total Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => (
                    <tr key={c.email} onClick={() => router.push(`/admin/creators/${encodeURIComponent(c.email)}`)} className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-zinc-100">{c.name || c.email}</p>
                        <p className="text-[11px] text-zinc-500 font-mono">{c.email}</p>
                      </td>
                      <td className="px-5 py-4 text-center text-sm text-zinc-100">{c.total_submissions}</td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          {c.platforms.map((p) => (
                            <span key={p} className="bg-green-400/10 text-green-400 text-[10px] font-mono px-1.5 py-0.5 rounded">{p}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-mono text-zinc-100">{formatNumber(c.total_views)}</td>
                      <td className="px-5 py-4 text-right text-sm font-mono text-zinc-100">{formatNumber(c.total_comments)}</td>
                      <td className="px-5 py-4 text-right text-sm font-mono text-green-400">{formatCurrency(c.total_paid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {data && <Pagination page={data.page} totalPages={data.pages} onPageChange={setPage} />}
      </div>
    </AdminGuard>
  )
}
